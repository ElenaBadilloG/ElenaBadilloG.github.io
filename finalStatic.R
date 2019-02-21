#download.file(url='https://media.githubusercontent.com/media/OpenDataSTL/stl-crime-data/master/clean_data/stl_crime_data.txt',
              #destfile="/Users/elenabg/exploratory_LFP/GeoViz/data/stLouis.txt")

library(rgdal)
library(sf)
library(rnaturalearth)
library(rnaturalearthdata)
library(tidycensus)
library(tidyverse)
library(ggplot2)
library(here)
library(treemapify)
library(extrafont)
library(RColorBrewer)
library(gridExtra)
library(raster)
library(maptools)
library(ggmap)
library(gginnards)

##### Build a Customized ggplot2 Theme:
theme_ebg <- theme(line=element_line(size=0.5, lineend = 'round' ),
                   rect=element_rect(fill = "white", colour = "grey26"),
                   text=element_text(family = "Trebuchet MS", colour = "grey26" ),
                   aspect.ratio = 0.75,
                   plot.margin = margin(0.75,0.75,0.75,0.75, 'cm'),
                   plot.background = element_rect(fill = "white", colour = "lightcyan3",
                                                  size = 3),
                   
                   plot.title=element_text(size = rel(2.25), color="grey26", hjust = 0, 
                                           vjust = 1.75, face = "bold"),
                   plot.subtitle = element_text(size = rel(1.65), color="lightcyan4",
                                                hjust = 0, vjust = 2),
                   panel.background = element_rect(colour = "grey80", fill = 'white'),
                   panel.grid.major = element_line(colour = "grey90", size=0.20),
                   
                   axis.text = element_text(size=16, colour = "grey50", vjust = 0),
                   axis.ticks.x = element_line(size=1.25, colour = "grey50"),
                   axis.ticks.y = element_line(size=1.25, colour = "grey50"),
                   axis.ticks.length = unit(0.25, "cm"),
                   axis.title.y = element_text(size = rel(1.5), angle = 90, face = "bold",
                                               vjust = 0),
                   axis.title.x = element_text(size = rel(1.5), angle = 0, face = "bold",
                                               vjust = -4),
                   
                   legend.justification = "center",
                   legend.box.background = element_rect(colour = "grey90"),
                   legend.box.margin = margin(0.5,0.5,0.5,0.5),
                   legend.text = element_text(size = rel(1.35)),
                   legend.title = element_text(size = rel(1.5), face = "bold",
                                               colour = "lightcyan4"),
                   legend.key = element_rect(fill = "grey96"),
                   strip.background = element_rect(colour = "grey80", fill = "grey96"),
                   strip.text.x = element_text(hjust=0.1, color='grey40',
                                               size = rel(1.25),  face = "bold"),
                   plot.caption = element_text(vjust=-2, size = rel(1.25)),
                   panel.spacing = unit(0.5, "cm"))

hoursw <- read.csv("/Users/elenabg/exploratory_LFP/flp/data/oecd_hoursw.csv")

#  Function to create 'region' column:

add_region <- function(df) {
  df <- mutate(df, Region = ifelse(Country %in% c('Sweden', 'Norway','Denmark','Finland'), "Nordic",
                                   ifelse(Country %in% c('Japan', 'Korea'), 'Asia',
                                          ifelse(Country %in% c('Germany', 'Netherlands','Luxembourg', 'France',
                                                                'Hungary', 'Poland', 'Austria', 'Belgium', 'Czech Republic',
                                                                'Switzerland'), 'Western Europe', 
                                                 ifelse(Country %in% c('Spain', 'Italy', 'Portugal', 'Greece'), "Mediterranean",
                                                        'Rest')))))
  return(df)
}

hoursw <- add_region(hoursw) 

# Obtain mean weekly hours worked on average over 1980-2017 for each country:
means <- hoursw %>% 
  group_by(Country, Region) %>% 
  summarise(av_hours = mean(Value, na.rm = TRUE)) %>%
  arrange(av_hours)

# Add job mismatch data to the small summary dataset:
mism <- read.csv("/Users/elenabg/exploratory_LFP/flp/data/mism.csv")
mism_oq <- filter(mism, Indicator %in% c('Overqualification'))
means <- merge(means, mism_oq, by = c("Country"), all.x = TRUE) # not helpful, too broad

hw_mm <- merge(hoursw, mism_oq, by = c("Country"), all.x = TRUE)
hw_mm_16 <- filter(hw_mm, Time.x == 2016)

## I. 2 Public Sector Size, Population, and LFP

# Load and process employment participation rate data:
epr <- read.csv("/Users/elenabg/exploratory_LFP/flp/data/lfs.csv")
epr <-  add_region(epr) 
epr_allage <- filter(epr, AGE %in% c('1564'))
epr_lfs <- filter(epr_allage, Series %in% c('Labour force participation rate'))


epr_lfs16 <- filter(epr_lfs, Time==2016)
epr_lfs16 <- filter(epr_lfs16, !Sex == 'All persons')
epr_lfs_mm <- merge(epr_lfs16, mism_oq, by = c("Country"), all.x = TRUE)
epr_lfs_mmna <- filter(epr_lfs_mm, !Region == 'Asia') # data NA

# Build arbitrary color palettes for arbitrary size vars:
gg_color_hue <- function(n) {
  hues = seq(15, 375, length=n+1)
  hcl(h=hues, l=65, c=100)[1:n]
}

# Build arbitrary color palettes for regions:
mycols <- gg_color_hue(length(unique(means$Region)))
names(mycols) <- unique(means$Region)

mycols["Rest"] <- "#99d8c9"
mycols["Nordic"] <- "#80b1d3"
mycols["Asia"] <- "#fb9a99"
mycols["Western Europe"] <- "#dfc27d"
mycols["Mediterranean"] <- "#af77d0"

##### I.3 LFP DATASET, TIME SERIES BY GENDER

# Labour force participation rate:
lfp <- filter(epr_allage, Series %in% c('Labour force participation rate'))
lfp <-rename(lfp, LFP = Value)

lfpw <- filter(lfp, SEX %in% c('WOMEN')) # fem lfs
lfpmw <- filter(lfp, SEX %in% c('MEN'))
lfpmw$LFP_W <- lfpw$LFP
lfpmw <- mutate(lfpmw, mw_dif = ((LFP - LFP_W)))

##########  IV. Public Expenditures by Type and Women LFP

# Government Size: measured as the ratio of total taxation to GDP
tax <- read.csv("/Users/elenabg/exploratory_LFP/flp/data/tax.csv")
total_tax <- filter(tax, TAX %in% c('TOTALTAX'))
names(total_tax)[names(total_tax) == 'Year'] <- 'Time'
df <- merge(lfpmw, total_tax, by = c("Country", "Time")) 
names(df)[names(df) == 'Value'] <- 'Tax'

# Load and process job strain data:
jobq <- read.csv("/Users/elenabg/exploratory_LFP/flp/data/jobq.csv")
jobq <- filter(jobq, Age== 'Total')
jobq <- filter(jobq, Components == 'Job Strain')
jobq <- filter(jobq, Education == 'Total')
jobq <- filter(jobq, Sex == 'Total')

JSindex<- jobq %>% 
  group_by(Country) %>% 
  summarise(JobStrain = mean(Value))

# Add job strain index to the dataset:
df_LGQ <- merge(df, JSindex, by = c("Country"), all.x = TRUE) # lfp, tax, jobstr
gov_exp <- read.csv("/Users/elenabg/exploratory_LFP/flp/data/gov_exp.csv")

gov_exp$Indicator <- sub(", percentage of GDP.*", "", gov_exp$Indicator)
gov_exp$Indicator <- sub("General government expenditure by function,*", "", gov_exp$Indicator)
gov_exp$Indicator <- sub(", percentage of total expenditure of general government (GG)*", "", gov_exp$Indicator)
gov_exp$Indicator <- sub(", percentage of total expenditure of GG*", "", gov_exp$Indicator)

gov_exp <- filter(gov_exp, !Indicator %in% c('Net lending/net borrowing, General government',
                                             'Total general government (GG) revenue', 'Net saving of General Government',
                                             'Adjusted debt of general government', 'Gross debt of general government',
                                             ' total expenditure', 'Social benefits other than social transfers in kind',
                                             'Social transfers in kind'))
gov_exp$Indicator <- sub("(GG).*", "", gov_exp$Indicator)
gov_exp <- gov_exp %>% drop_na(Indicator)
df2 <- merge(df_LGQ, gov_exp, by = c("Country", "Time"), all.x = TRUE)
df2_2015 <- filter(df2, Time %in% c(2015))
tot_sp <- filter(gov_exp, Indicator %in% c('Social benefits and social transfers in kind')) 

df3 <- merge(df2, tot_sp, by = c("Country", "Time"), all.x = TRUE)
av_mw_dif <- df3 %>% 
  summarise(global_mw_dif  = mean(mw_dif))

WLFP_dev <- df3 %>% 
  group_by(Country) %>% 
  summarise(av_mwdif = (mean(mw_dif) - av_mw_dif$global_mw_dif) / av_mw_dif$global_mw_dif)

df3 <- merge(df3, WLFP_dev, by = c("Country"), all.x = TRUE)
df3 <- mutate(df3, SignWLFP = ifelse(av_mwdif > 0, "Above Average Male-Female LFP",
                                     "Below Average Male-Female LFP"))
soc_exp <- read.csv("/Users/elenabg/exploratory_LFP/flp/data/social_exp.csv")

soc_exp <- filter(soc_exp, !Branch %in% c('Health', 'Old age', 'Total')) 
soc_exp_str <- soc_exp %>% 
  na.omit() %>%
  group_by(Country, Branch) %>% 
  summarise(av_spend = mean(Value))
soc_exp_str <- mutate(soc_exp_str, ratio_spend = av_spend/sum(av_spend))

df5 <- merge(df3, soc_exp_str, by = c("Country"), all.x = TRUE)
df5 <-rename(df5, Public.Spending.Branch = Branch )

# Social spending data for 2015:
famsp <- filter(df5, Public.Spending.Branch == 'Family')
famsp <- filter(famsp, Indicator.y %in% c('Social benefits and social transfers(')) 
fams15 <- filter(famsp, Time == 2015)

# Hours per daily activity:
time <- read.csv("/Users/elenabg/exploratory_LFP/flp/data/time.csv")
time <- add_region(time) 
time2  <- filter(time, Description == 'Unpaid work')
time2  <- filter(time2, Sex != 'Total')
time2 <- merge(time2, fams15, by = c("Country"), all.x = TRUE)
time2<- filter(time2, !Country %in% c("China (People's Republic of)",
                                      'South Africa', 'Latvia'))
# Hours per daily activity:
lifeQ <- read.csv("/Users/elenabg/exploratory_LFP/flp/data/life.csv")
lifeQ <- add_region(lifeQ) 
life = filter(lifeQ, IND == 'Household net adjusted disposable income')
life = filter(life, Inequality == 'Total')

df6 <- merge(df3, soc_exp_str, by = c("Country"))
df6 <- filter(df6, Time==2015)
df6 <- filter(df6, Branch=='Family')
df6 <- df6 %>% distinct(av_mwdif, .keep_all = TRUE)

fdf <- merge(life, df6,  by = c("Country"))
### World Shapefile
world <- ne_countries(scale = "medium", returnclass = "sf")
world <-rename(world,  Country=sovereignt)
world$Country[world$Country %in% "United States of America"] <- "United States"
dfw <- right_join(fdf, world, by='Country')
dfw <- dfw %>%
  st_as_sf(na.fail = FALSE, crs = 4326) 

world_points<- st_centroid(dfw)
world_points <- cbind(dfw, st_coordinates(st_centroid(dfw$geometry)))

g <- ggplot(data = dfw) +
  theme_ebg +
  theme(panel.background = element_rect(size=0.5, colour = "grey90",
                    fill = '#032438')) +
  ggtitle("Lower Gender Labor Participation Gaps, Higher Household Income") +
  guides(fill=guide_legend(title='Household Net\n Disposable Income\n (USD)')) +
  labs(subtitle = "Labor participation gap between men and women tends to be lower in countries\n with higher public sector size",
       caption = "Source: OECD Statistics, 2016 \n Note: Gender LFP gap is measured as the absolute difference \nbetween male and female LFP ratios.") +
  xlab("") + ylab("") +
  geom_sf(aes(fill = Inc), size=0.25, alpha=0.75, color = 'black') +
  geom_col(data= world_points, aes(x=X, y=mw_dif, fill=Inc), 
           alpha=0.45,  width=12) +
  
  scale_fill_continuous(low = "ivory", high = "red2") +
  scale_colour_continuous(low = "ivory", high = "red2") +
  annotate("text", x=-160, y=38, label="Gender LFP Gap\n(0-50)", 
           size=1.7, color='white', family = "Trebuchet MS") 


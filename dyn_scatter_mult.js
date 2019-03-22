/* global d3 */

// Syntax for error-handling using fetch from: https://gist.github.com/odewahn/5a5eeb23279eed6a80d7798fdb47fe91
document.addEventListener('DOMContentLoaded', () => {
  fetch("scatter_df.json")
    .then( response => {
    return response.json()              
  })
    .then(data => ReverseScatter(data))
  });

function ReverseScatter(data) {
  
// Basic plot configurations
  const height = 850;
  const width = 1000;
  const margin = {top: 120, left: 80, right: 50, bottom: 80};

  const plotWidth = width - margin.right - margin.left;
  const plotHeight = height - 2*margin.top;
  const colorRange = ['#12939A', '#79C7E3', '#1A3177', '#FF9833', '#af77d0'];
  const countries = data.map((row) => {return row.COUNTRY});
  const regions = data.map((row) => {return row.Region}); 
  const regs = Array.from(new Set(regions))
  const color = d3.scaleOrdinal().domain(regions).range(colorRange);
  const textWidth = 30;
  // legend position parameters
  const leg_y = 145; 
  const leg_x = 90
  const yaxden = 1.5
  const yaxsp = 4

  const xaxden = 1.3
  const xaxsp = 560
  const trans_duration = 1000


// Domain, Range, and Scales
  var xD = data.reduce((d, row) => {
    return {min: Math.min(row.Tax, d.min), max: Math.max(row.Tax, d.max)
    };
  }, {min: Infinity, max: -Infinity});

  var yD = data.reduce((d, row) => {
    return {min: Math.min(row.LFP_W, d.min), max: Math.max(row.LFP_W, d.max)
    };
  }, {min: Infinity, max: -Infinity});

  var x = d3.scaleLinear().domain([xD.min-5, xD.max+5])
    .range([plotHeight, margin.top]).nice();

  var y = d3.scaleLinear().domain([yD.max+5, 30])
  .range([plotHeight, margin.top]).nice();

  var svg = d3.select('#dynscatter').append('svg')
    .attr('width', plotWidth).attr('height', plotHeight);

  var tooltip = d3.select("body")
    .append("div")
    .attr('class', 'tooltip');

  // Produce scatterplot:
  svg.selectAll(".dot")
      .data(data)
      .enter().append("circle")
      .attr("r", 8) //radius for every dot
      .attr("cx", function(d) {return x(d.Tax); }) // map each center circle (x,y) to tax, LFP pairs in the data
      .attr("cy", function(d) {return y(d.LFP_W);})
      //.attr('opacity', 0.75)
      .attr('fill', d => gradient(color(d.Region), d.Region.split(' ').join('')))
      .on("mouseover", function(d) { return tooltip.style("visibility", "visible").text(d.Country).style("left", (d3.event.pageX) + "px")
      .style("top", (d3.event.pageY - 28) + "px").style("background-color", color(d.Region))  ,
        d3.select(this).attr("r", 5)})
      .on("mouseout", function() { return tooltip.style("visibility", "hidden"),
        d3.select(this).attr("r", 8)});


  // Add X,Y axes with origin in the upper right corner:
  svg.append('g')
    .call(d3.axisBottom(x))
    .attr('class', 'xaxis')
    .attr('transform', `translate(${-10}, 115)`);

  svg.append("g")
      .call(d3.axisLeft(y))
      .attr('transform', `translate(${plotHeight+20}, 15)`);

  // text label for the x axis
  svg.append("text")             
      .attr("transform",
            "translate(" + (width-xaxsp) + " ," + 
                           (margin.top/xaxden) + ")")
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .attr('class', 'xtext')
      .text("Tax Revenues (%GDP) ");

  // text label for the y axis
  svg.append("text")             
      .attr("transform", "rotate(-90)")
      .attr("y", plotHeight/2 + yaxsp*margin.left + 10)
      .attr("x", 50 - (plotHeight / yaxden))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .attr('class', 'ytext')
      .text(" Female Labor Participation (%) ");

  // Add title
  svg.append("text").attr("transform", "translate(280, 30)")
    .style("text-anchor", "middle")
    .text("Public Sector Size and \n Female Labor Participation")
    .attr('font-size', 20)
    .attr('class', 'scattertitle')
    .attr('font-weight', "bold");

  // Add subtitle:
    svg.append("g").attr("transform", "translate(310, 30)")
     .append("text")
     .text("Countries with a higher female LFP have, on average, larger public \n sectors (higher taxation)")            
     .attr("text-anchor", "middle")
     .attr("dx", ".5em")
     .attr("dy", "1.5em")
     .attr('class', 'scattersubtitle')
     .attr('opacity', 0.85)
     .call(wrap, 1);

  // Add source caption
  svg.append("text")             
    .attr("transform",
          "translate(" + (width-480) + " ," + 
                         (margin.top + 475) + ")")
    .style("text-anchor", "middle")
    .text('Source: OECD Statistics, 2015')
    .attr('class', 'source')
    .attr('font-size', 12);

  // Add legend
  const legend = svg.selectAll('.rect').data(regs);
  legend.enter()
  .append('rect')
  .attr('class', 'rect')
  .attr("x", function(d, i) {return leg_x;})
  .attr("y", function(d, i) {return (i * 20) + leg_y;})
  .attr('height', 20)
  .attr('width', 20)
  .attr("rx", "4px")
  .attr("ry", "4px")
  .attr('fill', (d, i)=> gradient(color(d), d.split(' ').join('')));

  // legend texts
  const legTxt = svg.selectAll(null).data(regs);
    legTxt.enter()
    .append('text')
    .attr('class', 'legText')
    .attr("x", function(d, i) {return leg_x+25;})
    .attr("y", function(d, i) {return (i * 20 + leg_y+15);})
    .attr('font-size', 14)
    .text(String);

  
  // Helper function to wrap long text in chunks - I modified it to make it general and adjust text chunk sizes 
     // but main idea and snippets are taken from: https://bl.ocks.org/mbostock/7555321
  function wrap(text, width) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().match(/.{1,95}/g).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 0.02, // ems
        y = text.attr("y"),
        x = text.attr("x"),
        dy = parseFloat(text.attr("dy")),
        dx = parseFloat(text.attr("dx")),
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      }
    }
  });
}
    var xbut = 85

    //Create Job Quality button
    
    var ybut = 5

    var JQButton = svg.append("g")
      .attr("id", "LabButton")
      .attr('class', "unclickable RoundedButton") 
      .attr("transform", "translate(" + x.range()[0] + "," + y.range()[1] + ")");
    
    JQButton.append("rect")
      .attr("x", xbut)
      .attr("y", ybut-15)
      .attr("width", 85)
      .attr("height", 25);
    
    JQButton.append("text")
      .attr("x", xbut+8)
      .attr("y", ybut)
      .html(" Job Quality ");
    
    //Define click behavior

    JQButton.on("click", function() {
      d3.selectAll(".dot").remove();
      d3.selectAll("text.scattertitle").remove();
      d3.selectAll("text.scattersubtitle").remove();
      d3.selectAll("text.xtext").remove();
      d3.selectAll("text.ytext").remove();
      d3.selectAll(".xaxis").remove();

      // Produce new scatterplot:
      updateVar("JobQuality", " Job Quality (%) ", "Job Quality ",
       "Higher female LFP seems correlated with better jobs...")
  
});
    //Create Gender Gap button
    
    ybut = ybut + 35

    var GWGButton = svg.append("g")
      .attr("id", "LabButton")
      .attr("opacity", 10)
      .attr('class', "unclickable RoundedButton") 
      .attr("transform", "translate(" + x.range()[0] + "," + y.range()[1] + ")");
    
    GWGButton.append("rect")
      .attr("x", xbut )
      .attr("y", ybut-15)
      .attr("width", 125)
      .attr("height", 25);
    
    GWGButton.append("text")
      .attr("x", xbut+8)
      .attr("y", ybut)
      .html(" Gender Wage Gap ");
    
    //Define click behavior

    GWGButton.on("click", function() {
      d3.selectAll(".dot").remove();
      d3.selectAll("text.scattertitle").remove();
      d3.selectAll("text.scattersubtitle").remove();
      d3.selectAll("text.xtext").remove();
      d3.selectAll("text.ytext").remove();
      d3.selectAll(".xaxis").remove();

      // Produce new scatterplot:
      updateVar("Gap", "Gender Wage Gap (%)", "Gender Wage Gap ",
       "Slightly negative correlation between the gender wage gap and female LFP...")

});

  
    //Create Extra Hours button

    ybut = ybut + 35

    var ExtraHButton = svg.append("g")
      .attr("id", "LabButton")
      .attr("opacity", 10)
      .attr('class', "unclickable RoundedButton") 
      .attr("transform", "translate(" + x.range()[0] + "," + y.range()[1] + ")");
    
    ExtraHButton.append("rect")
      .attr("x", xbut)
      .attr("y", ybut-15)
      .attr("width", 135)
      .attr("height", 25);
    
    ExtraHButton.append("text")
      .attr("x", xbut+8)
      .attr("y", ybut)
      .html("Excess Hours Worked");
    
    //Define click behavior

    ExtraHButton.on("click", function() {
      d3.selectAll(".dot").remove();
      d3.selectAll("text.scattertitle").remove();
      d3.selectAll("text.scattersubtitle").remove();
      d3.selectAll("text.xtext").remove();
      d3.selectAll("text.ytext").remove();
      d3.selectAll(".xaxis").remove();

      // Produce new scatterplot:
      updateVar("ExcHours", "Employees Working Very Long Hours (%)", "Excess Hours Worked ",
        " Fewer workers in countries with higher LFP report \n excessive amount of hours worked")
});

  //Create LM Insecurity button

    ybut = ybut + 35

    var LMinsButton = svg.append("g")
      .attr("id", "LabButton")
      .attr("opacity", 10)
      .attr('class', "unclickable RoundedButton") 
      .attr("transform", "translate(" + x.range()[0] + "," + y.range()[1] + ")");
    
    LMinsButton.append("rect")
      .attr("x", xbut)
      .attr("y", ybut-15)
      .attr("width", 145)
      .attr("height", 25);
    
    LMinsButton.append("text")
      .attr("x", xbut+8)
      .attr("y", ybut)
      .html("Labor Market Insecurity");
    
    //Define click behavior

    LMinsButton.on("click", function() {
      d3.selectAll(".dot").remove();
      d3.selectAll("text.scattertitle").remove();
      d3.selectAll("text.scattersubtitle").remove();
      d3.selectAll("text.xtext").remove();
      d3.selectAll("text.ytext").remove();
      d3.selectAll(".xaxis").remove();

      // Produce new scatterplot:
      updateVar("LMins", "Labor Market Insecurity (index)", "Labor Market Insecurity ",
        " People from countries with higher LFP tend to perceive \n less labor market insecurity ")
});

    //Create Household Income button

    var ybut = ybut + 35

    var IncButton = svg.append("g")
      .attr("id", "QualButton")
      .attr("opacity", 10)
      .attr('class', "unclickable RoundedButton") 
      .attr("transform", "translate(" + x.range()[0] + "," + y.range()[1] + ")");
    
    IncButton.append("rect")
      .attr("x", xbut)
      .attr("y", ybut)
      .attr("width", 140)
      .attr("height", 25);
    
    IncButton.append("text")
      .attr("x", xbut+8)
      .attr("y", ybut+15)
      .html(" Net Household Income");
    
    //Define click behavior

    IncButton.on("click", function() {
      d3.selectAll(".dot").remove();
      d3.selectAll("text.scattertitle").remove();
      d3.selectAll("text.scattersubtitle").remove();
      d3.selectAll("text.xtext").remove();
      d3.selectAll("text.ytext").remove();
      d3.selectAll(".xaxis").remove();

      // Produce new scatterplot:
    updateVar("Inc", " Net Disposable Household Income (1000 USD) ", "Household Income ",
       "Even after (higher) taxes,  households in countries with \n higher female LFP tend to be wealthier")

});

    //Create Life Satisfaction button

    ybut = ybut + 55

    var LSButton = svg.append("g")
      .attr("id", "QualButton")
      .attr("opacity", 10)
      .attr('class', "unclickable RoundedButton") 
      .attr("transform", "translate(" + x.range()[0] + "," + y.range()[1] + ")");
    
    LSButton.append("rect")
      .attr("x", xbut)
      .attr("y", ybut-15)
      .attr("width", 125)
      .attr("height", 25);
    
    LSButton.append("text")
      .attr("x", xbut+8)
      .attr("y", ybut)
      .html("Life Satisfaction");
    
    //Define click behavior

    LSButton.on("click", function() {
      d3.selectAll(".dot").remove();
      d3.selectAll("text.scattertitle").remove();
      d3.selectAll("text.scattersubtitle").remove();
      d3.selectAll("text.xtext").remove();
      d3.selectAll("text.ytext").remove();
      d3.selectAll(".xaxis").remove();

      // Produce new scatterplot:
      updateVar("LifeSat", "Life Satisfaction (index)", "Life Satisfaction ",
        "People in countries with higher female LFP report higher life satisfaction")
});

  //Create Education button

    ybut = ybut + 35

    var EducButton = svg.append("g")
      .attr("id", "QualButton")
      .attr("opacity", 10)
      .attr('class', "unclickable RoundedButton") 
      .attr("transform", "translate(" + x.range()[0] + "," + y.range()[1] + ")");
    
    EducButton.append("rect")
      .attr("x", xbut)
      .attr("y", ybut-15)
      .attr("width", 125)
      .attr("height", 25);
    
    EducButton.append("text")
      .attr("x", xbut+8)
      .attr("y", ybut)
      .html("Educational Level");
    
    //Define click behavior

    EducButton.on("click", function() {
      d3.selectAll(".dot").remove();
      d3.selectAll("text.scattertitle").remove();
      d3.selectAll("text.scattersubtitle").remove();
      d3.selectAll("text.xtext").remove();
      d3.selectAll("text.ytext").remove();
      d3.selectAll(".xaxis").remove();

      // Produce new scatterplot:
      updateVar("Educ", "Years of Education", "Educational Level ",
        "People in countries with higher female LFP complete \n more years in formal education")
});

    //Create Education button
    
    ybut = ybut + 35

    var LifeExpButton = svg.append("g")
      .attr("id", "QualButton")
      .attr("opacity", 10)
      .attr('class', "unclickable RoundedButton") 
      .attr("transform", "translate(" + x.range()[0] + "," + y.range()[1] + ")");
    
    LifeExpButton.append("rect")
      .attr("x", xbut)
      .attr("y", ybut-15)
      .attr("width", 128)
      .attr("height", 25);
    
    LifeExpButton.append("text")
      .attr("x", xbut+8)
      .attr("y", ybut)
      .html("Life Expectancy");
    
    //Define click behavior

    LifeExpButton.on("click", function() {
      d3.selectAll(".dot").remove();
      d3.selectAll("text.scattertitle").remove();
      d3.selectAll("text.scattersubtitle").remove();
      d3.selectAll("text.xtext").remove();
      d3.selectAll("text.ytext").remove();
      d3.selectAll(".xaxis").remove();

      // Produce new scatterplot:
      updateVar("LifExp", "Life Expectancy", "Life Expectancy ",
        "Countries with higher female LFP tend to have higher life expectancy")
});


//Create Pollution button

    ybut = ybut + 35

    var PollButton = svg.append("g")
      .attr("id", "QualButton")
      .attr("opacity", 10)
      .attr('class', "unclickable RoundedButton") 
      .attr("transform", "translate(" + x.range()[0] + "," + y.range()[1] + ")");
    
    PollButton.append("rect")
      .attr("x", xbut)
      .attr("y", ybut-15)
      .attr("width", 128)
      .attr("height", 25);
    
    PollButton.append("text")
      .attr("x", xbut+8)
      .attr("y", ybut)
      .html("Air Pollution");
    
    //Define click behavior

    PollButton.on("click", function() {
      d3.selectAll(".dot").remove();
      d3.selectAll("text.scattertitle").remove();
      d3.selectAll("text.scattersubtitle").remove();
      d3.selectAll("text.xtext").remove();
      d3.selectAll("text.ytext").remove();
      d3.selectAll(".xaxis").remove();

      // Produce new scatterplot:
      updateVar("Poll", "Air Pollution Level (index)", "Pollution Level ",
        " Lower air pollution levels seem strongly correlated \n with higher female LFP")
});

//Create Homicides button

    ybut = ybut + 35

    var HomButton = svg.append("g")
      .attr("id", "QualButton")
      .attr("opacity", 10)
      .attr('class', "unclickable RoundedButton") 
      .attr("transform", "translate(" + x.range()[0] + "," + y.range()[1] + ")");
    
    HomButton.append("rect")
      .attr("x", xbut)
      .attr("y", ybut-15)
      .attr("width", 128)
      .attr("height", 25);
    
    HomButton.append("text")
      .attr("x", xbut+8)
      .attr("y", ybut)
      .html("Voter Turnout");
    
    //Define click behavior

    HomButton.on("click", function() {
      d3.selectAll(".dot").remove();
      d3.selectAll("text.scattertitle").remove();
      d3.selectAll("text.scattersubtitle").remove();
      d3.selectAll("text.xtext").remove();
      d3.selectAll("text.ytext").remove();
      d3.selectAll(".xaxis").remove();

      // Produce new scatterplot:
      updateVar("Vot", "Voter Turnout (%)", "Civic Engagement ",
        " We can see a slightly positive correlation between civic engagement \n and higher LFP for women ")
});

//Create Health button

    ybut = ybut + 35

    var HealthButton = svg.append("g")
      .attr("id", "QualButton")
      .attr("opacity", 10)
      .attr('class', "RoundedButton") 
      .attr("transform", "translate(" + x.range()[0] + "," + y.range()[1] + ")");
    
    HealthButton.append("rect")
      .attr("x", xbut)
      .attr("y", ybut-15)
      .attr("width", 140)
      .attr("height", 25);
    
    HealthButton.append("text")
      .attr("x", xbut+8)
      .attr("y", ybut)
      .html("Self-Reported Health");
    
    //Define click behavior

    HealthButton.on("click", function() {
      d3.selectAll(".dot").remove();
      d3.selectAll("text.scattertitle").remove();
      d3.selectAll("text.scattersubtitle").remove();
      d3.selectAll("text.xtext").remove();
      d3.selectAll("text.ytext").remove();
      d3.selectAll(".xaxis").remove();

      // Produce new scatterplot:
      updateVar("Health", "Self-Reported Health (%)", "Self-Reported Health ",
        " People in countries with higher female LFP tend to report \n better health status ")
});

   //Create Gov Size button

    ybut = ybut + 50

    var GovButton = svg.append("g")
      .attr("id", "GovButton")
      .attr("opacity", 10)
      .attr('class', "unclickable RoundedButton") 
      .attr("transform", "translate(" + x.range()[0] + "," + y.range()[1] + ")");
    
    GovButton.append("rect")
      .attr("x", xbut)
      .attr("y", ybut-15)
      .attr("width", 128)
      .attr("height", 25);
    
    GovButton.append("text")
      .attr("x", xbut+8)
      .attr("y", ybut)
      .html("Public Sector Size");
    
    //Define click behavior

    GovButton.on("click", function() {
      d3.selectAll(".dot").remove();
      d3.selectAll("text.scattertitle").remove();
      d3.selectAll("text.scattersubtitle").remove();
      d3.selectAll("text.xtext").remove();
      d3.selectAll("text.ytext").remove();
      d3.selectAll(".xaxis").remove();

      // Produce new scatterplot:
      updateVar("Tax", "Tax Revenue (%GDP)", "Public Sector Size ",
       "Countries with higher female LFP have, on average, larger public sectors")
});

     //Create Family Policy button

    ybut = ybut + 35

    var FamButton = svg.append("g")
      .attr("id", "GovButton")
      .attr("class", "button")
      .attr("opacity", 10)
      .attr('class', "unclickable RoundedButton") 
      .attr("transform", "translate(" + x.range()[0] + "," + y.range()[1] + ")");
    
    FamButton.append("rect")
      .attr("x", xbut)
      .attr("y", ybut-15)
      .attr("width", 178)
      .attr("height", 25);
    
    FamButton.append("text")
      .attr("x", xbut+8)
      .attr("y", ybut)
      .html("Family Program Expenditures");
    
    //Define click behavior

    FamButton.on("click", function() {
      d3.selectAll(".dot").remove();
      d3.selectAll("text.scattertitle").remove();
      d3.selectAll("text.scattersubtitle").remove();
      d3.selectAll("text.xtext").remove();
      d3.selectAll("text.ytext").remove();
      d3.selectAll(".xaxis").remove();

      // Produce new scatterplot:
      updateVar("FamSpend", "Family Program Expenditures (%Total Exp.)", "Expenditures in Family Policy Programs ",
       " Governments in countries with higher LFP spend relatively more \n in family policy programs")
});



function updateVar(varname, axt, varwd, subt, adjaxis=false) {  

  // Domain, Range, and Scales
  var xD = data.reduce((d, row) => {
    return {min: Math.min(row[varname], d.min), max: Math.max(row[varname], d.max)
    };
  }, {min: Infinity, max: -Infinity});

  if(adjaxis === false) {
    var x = d3.scaleLinear().domain([xD.min-1, xD.max+1])
      .range([plotHeight, margin.top]).nice()}

  else {var x = d3.scaleLinear().domain([adjaxis[0], adjaxis[1]])
      .range([plotHeight, margin.top]).nice()};

  
  //Update all circles
  d3.select('#dynscatter').selectAll("circle")
    .data(data)
    .transition()
    .duration(trans_duration)
    .attr("cx", function(d) {
      return x(d[varname]);
    })

  // Add X,Y axes with origin in the upper right corner:
  svg.append('g')
    .call(d3.axisBottom(x))
    .attr('class', 'xaxis')
    .attr('transform', `translate(${-10}, 115)`);

  // text label for the x axis
  svg.append("text")             
      .attr("transform",
            "translate(" + (width-xaxsp) + " ," + 
                           (margin.top/xaxden) + ")")
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .attr('class', 'xtext')
      .text(axt);

  // text label for the y axis
  svg.append("text")             
      .attr("transform", "rotate(-90)")
      .attr("y", plotHeight/2 + yaxsp*margin.left + 10)
      .attr("x", 50 - (plotHeight / yaxden))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .attr('class', 'ytext')
      .text(" Female Labor Participation (%) ");

  // Add title
  svg.append("text")             
    .attr("transform",
          "translate(" + (width-540) + " ," + 
                         (margin.top-95) + ")")
    .style("text-anchor", "middle")
    .text(varwd + "and \n Female Labor Participation")
    .attr('font-size', 20)
    .attr('class', 'scattertitle')
    .attr('font-weight', "bold")

    // Add subtitle:
    svg.append("g").attr("transform", "translate(290, 30)")
     .append("text")
     .text(subt)            
     .attr("text-anchor", "middle")
     .attr("dx", ".5em")
     .attr("dy", "1.5em")
     .attr('class', 'scattersubtitle')
     .call(wrap, 1);

}

};

var colorLab = "#C6D2D2"
var colorQual = "#D3EAD3"
var colorGov = "#EAE8E8"

 /* For the LAB drop shadow filter... */

 function gradient(colorG, gradID) {
    var grad = svg.append("defs")
      .append("linearGradient")
        .attr("id", gradID)
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "100%")
        .attr("spreadMethod", "reflect");

    grad.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "white")
        .attr("stop-opacity", 1);

    grad.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", colorG)
        .attr("stop-opacity", 1);
      return 'url(#'+gradID+')'}

  var gradientLAB = gradient(colorLab, "gradientLAB")
  var gradientQual = gradient(colorQual, "gradientQUAL")
  var gradientLAB = gradient(colorGov, "gradientGOV")




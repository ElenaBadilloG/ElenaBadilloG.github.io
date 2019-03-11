// Basic plot configurations
  const H = 800;
  const W = 1000;
  const MARG = {top: 120, left: 80, right: 50, bottom: 80};

  const plotWidth = W - MARG.right - MARG.left;
  const plotHeight = H - 2*MARG.top;
  const textWidth = 30;
  // legend position parameters
  const LEG_y = 360; 
  const LEG_x = 120
  const yaxden = 1.5
  const yaxsp = 4

  const xaxden = 1.3
  const xaxsp = 560
  const trans_duration = 1000

  const colorRg = ['#12939A', '#79C7E3', '#1A3177', '#FF9833', '#af77d0'];


d3.json("gov_exp_soc.json", function(error, data) {
  if (error) throw error;
      MakeScatter(data)
  })

function MakeScatter(data) {

      d3.selectAll(".scatter_hold").remove();
      d3.selectAll(".dot2").remove();
      d3.selectAll(".scattertitle2").remove();
      d3.selectAll(".scattersubtitle2").remove();
      d3.selectAll(".xtext2").remove();
      d3.selectAll(".ytext2").remove();
      d3.selectAll(".yax").remove();
      d3.selectAll(".xax").remove();
      d3.selectAll(".source2").remove();
      d3.selectAll(".legText2").remove();

  const svg = d3.select('#govscatter')
  .append('svg')
  .attr('class', 'scatter_hold')
  .attr('width', plotWidth)
  .attr('height', plotHeight);

  const countries = data.map((row) => {return row.Country});
  const regions = data.map((row) => {return row.Region}); 
  const regs = Array.from(new Set(regions))
  const color = d3.scaleOrdinal().domain(regions).range(colorRg);


// Domain, Range, and Scales
  var xD = data.reduce((d, row) => {
    return {min: Math.min(row.Expend, d.min), max: Math.max(row.Expend, d.max)
    };
  }, {min: Infinity, max: -Infinity});

  var yD = data.reduce((d, row) => {
    return {min: Math.min(row.lfp_gap, d.min), max: Math.max(row.lfp_gap, d.max)
    };
  }, {min: Infinity, max: -Infinity});

  var x = d3.scaleLinear().domain([0, xD.max+1.5])
    .range([plotHeight, MARG.top]).nice();

  var y = d3.scaleLinear().domain([yD.max, 0])
  .range([plotHeight, MARG.top]).nice();


  var tooltip = d3.select("body")
    .append("div")
    .attr('class', 'tooltip');

  // Produce scatterplot:
  svg.selectAll(".dot2")
      .data(data)
      .enter()
      .append("circle")
      .transition()
      .duration(trans_duration)
      .attr("r", 6) //radius for every dot
      .attr("cx", function(d) {return x(d.Expend); }) // map each center circle (x,y) to tax, LFP pairs in the data
      .attr("cy", function(d) {return y(d.lfp_gap);})
      .attr('opacity', 0.85)
      .attr('fill', d => color(d.Region))
     ;

  svg.selectAll(".dot2")
      .data(data)
      .on("mouseover", function(d) { return tooltip.style("visibility", "visible").text(d.Country).style("left", (d3.event.pageX) + "px")
      .style("top", (d3.event.pageY - 28) + "px").style("background-color", color(d.Region))  ,
        d3.select(this).attr("r", 4)})
      .on("mouseout", function() { return tooltip.style("visibility", "hidden"),
        d3.select(this).attr("r", 6)});


  // Add X,Y axes with origin in the upper right corner:
  svg.append('g')
    .attr('class', 'xax')
    .call(d3.axisBottom(x))
    .attr('transform', `translate(${-10}, 115)`);

  svg.append("g")
      .attr('class', 'yax')
      .call(d3.axisLeft(y))
      .attr('transform', `translate(${plotHeight+22}, 15)`);

  // text label for the x axis
  svg.append("text")             
      .attr("transform",
            "translate(" + (W-xaxsp-25) + " ," + 
                           (MARG.top/xaxden) + ")")
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .attr('class', 'xtext2')
      .text("Public Expenditures by Type (%GDP) ");

  // text label for the y axis
  svg.append("text")             
      .attr("transform", "rotate(-90)")
      .attr("y", plotHeight/2 + yaxsp*MARG.left)
      .attr("x", 0 - (plotHeight / yaxden))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .attr('class', 'ytext2')
      .text(" Gender Labor Participation Gap (%) ");

  // Add subtitle:
    svg.append("g").attr("transform", "translate(310, 30)")
     .append("text")
     .text(" ")            
     .attr("text-anchor", "middle")
     .attr("dx", ".5em")
     .attr("dy", "1.5em")
     .attr('class', 'scattersubtitle2')
     .attr('font-size', 15)
     .attr('stroke', '#799c94')
     .attr('opacity', 0.85)
     .call(wrap, 1);

  // Add source caption
  svg.append("text")             
    .attr("transform",
          "translate(" + (W-510) + " ," + 
                         (MARG.top + 425) + ")")
    .style("text-anchor", "middle")
    .text('Source: OECD Statistics, 2015')
    .attr('class', 'source2')
    .attr('font-size', 11);

  // Add legend
  const legend = svg.selectAll('.rect').data(regs);
  legend.enter()
  .append('rect')
  .attr('class', 'rect')
  .attr("x", function(d, i) {return LEG_x;})
  .attr("y", function(d, i) {return (i * 20) + LEG_y;})
  .attr('height', 20)
  .attr('width', 20)
  .attr('fill', function(d, i) {return color(i);});

  // legend texts
  const legTxt = svg.selectAll(null).data(regs);
    legTxt.enter()
    .append('text')
    .attr('class', 'legText2')
    .attr("x", function(d, i) {return LEG_x+25;})
    .attr("y", function(d, i) {return (i * 20 + LEG_y+15);})
    .attr('font-size', 14)
    .text(String);


    //Create SafetyExp button
    var xbut = 675
    var ybut = 150

    var SAFEButton = svg.append("g")
      .attr("id", "Button")
      .attr("opacity", 10)
      .classed("unclickable", true) //Initially not clickable
      //.attr("transform", "translate(" + x.range()[0] + "," + y.range()[1] + ")");
    
    SAFEButton.append("rect")
      .attr("x", xbut)
      .attr("y", ybut)
      .attr("width", 155)
      .attr("height", 25);
    
    SAFEButton.append("text")
      .attr("x", xbut+2)
      .attr("y", ybut+15)
      .html(" Public Order and Safety ");
    // Create EconExp button

    var ECONButton = svg.append("g")
      .attr("id", "Button")
      .attr("opacity", 10)
      .classed("unclickable", true) //Initially not clickable
      //.attr("transform", "translate(" + x.range()[0] + "," + y.range()[1] + ")");
    
    ECONButton.append("rect")
      .attr("x", xbut)
      .attr("y", ybut+35)
      .attr("width", 155)
      .attr("height", 25);
    
    ECONButton.append("text")
      .attr("x", xbut+2)
      .attr("y", ybut+50)
      .html(" Economic Affairs ");
  
    // Create DefExp button

    var DEFButton = svg.append("g")
      .attr("id", "Button")
      .attr("opacity", 10)
      .classed("unclickable", true) //Initially not clickable
      //.attr("transform", "translate(" + x.range()[0] + "," + y.range()[1] + ")");
    
    DEFButton.append("rect")
      .attr("x", xbut)
      .attr("y", ybut+70)
      .attr("width", 155)
      .attr("height", 25);
    
    DEFButton.append("text")
      .attr("x", xbut+2)
      .attr("y", ybut+85)
      .html(" Defence/Military ");

        // Create SocExp button

    var SOCButton = svg.append("g")
      .attr("id", "Button")
      .attr("opacity", 10)
      .classed("unclickable", true) //Initially not clickable
      //.attr("transform", "translate(" + x.range()[0] + "," + y.range()[1] + ")");
    
    SOCButton.append("rect")
      .attr("x", xbut)
      .attr("y", ybut+105)
      .attr("width", 155)
      .attr("height", 25);
    
    SOCButton.append("text")
      .attr("x", xbut+2)
      .attr("y", ybut+120)
      .html("Social benefits and transfers");

   // Create Housing button

    var HOUButton = svg.append("g")
      .attr("id", "Button")
      .attr("opacity", 10)
      .classed("unclickable", true) //Initially not clickable
      //.attr("transform", "translate(" + x.range()[0] + "," + y.range()[1] + ")");
    
    HOUButton.append("rect")
      .attr("x", xbut)
      .attr("y", ybut+140)
      .attr("width", 155)
      .attr("height", 25);
    
    HOUButton.append("text")
      .attr("x", xbut+2)
      .attr("y", ybut+155)
      .html("Housing");

  // Create Health button

    var HEAButton = svg.append("g")
      .attr("id", "Button")
      .attr("opacity", 10)
      .classed("unclickable", true) //Initially not clickable
      //.attr("transform", "translate(" + x.range()[0] + "," + y.range()[1] + ")");
    
    HEAButton.append("rect")
      .attr("x", xbut)
      .attr("y", ybut+175)
      .attr("width", 155)
      .attr("height", 25);
    
    HEAButton.append("text")
      .attr("x", xbut+2)
      .attr("y", ybut+190)
      .html("Health");


  // Create Health button

    var EDUCButton = svg.append("g")
      .attr("id", "Button")
      .attr("opacity", 10)
      .classed("unclickable", true) //Initially not clickable
      //.attr("transform", "translate(" + x.range()[0] + "," + y.range()[1] + ")");
    
    EDUCButton.append("rect")
      .attr("x", xbut)
      .attr("y", ybut+210)
      .attr("width", 155)
      .attr("height", 25);
    
    EDUCButton.append("text")
      .attr("x", xbut+2)
      .attr("y", ybut+225)
      .html("Education");


  //Define click behavior

    SAFEButton.on("click", function() {
      // Produce new scatterplot:
      d3.json("gov_exp_safe.json", function(error, data) {
          if (error) throw error;
              MakeScatter(data)
          })
    })

    ECONButton.on("click", function() {
      d3.selectAll(".dot2").remove();
      d3.selectAll("text.scattertitle2").remove();
      d3.selectAll("text.scattersubtitle2").remove();
      d3.selectAll("text.xtext2").remove();
      d3.selectAll("text.ytext2").remove();



      // Produce new scatterplot:
      d3.json("gov_exp_econ.json", function(error, data) {
          if (error) throw error;
              MakeScatter(data)
          })
    })
  
    DEFButton.on("click", function() {
      d3.selectAll(".dot2").remove();
      d3.selectAll("text.scattertitle2").remove();
      d3.selectAll("text.scattersubtitle2").remove();
      d3.selectAll("text.xtext2").remove();
      d3.selectAll("text.ytext2").remove();

      // Produce new scatterplot:
      d3.json("gov_exp_def.json", function(error, data) {
          if (error) throw error;
              MakeScatter(data)
          })
    })

    SOCButton.on("click", function() {
      d3.selectAll(".dot2").remove();
      d3.selectAll("text.scattertitle2").remove();
      d3.selectAll("text.scattersubtitle2").remove();
      d3.selectAll("text.xtext2").remove();
      d3.selectAll("text.ytext2").remove();

      // Produce new scatterplot:
      d3.json("gov_exp_soc.json", function(error, data) {
          if (error) throw error;
              MakeScatter(data)
          })
    })

   HOUButton.on("click", function() {
      d3.selectAll(".dot2").remove();
      d3.selectAll("text.scattertitle2").remove();
      d3.selectAll("text.scattersubtitle2").remove();
      d3.selectAll("text.xtext2").remove();
      d3.selectAll("text.ytext2").remove();

      // Produce new scatterplot:
      d3.json("gov_exp_house.json", function(error, data) {
          if (error) throw error;
              MakeScatter(data)
          })
    })


   HEAButton.on("click", function() {
      d3.selectAll(".dot2").remove();
      d3.selectAll("text.scattertitle2").remove();
      d3.selectAll("text.scattersubtitle2").remove();
      d3.selectAll("text.xtext2").remove();
      d3.selectAll("text.ytext2").remove();

      // Produce new scatterplot:
      d3.json("gov_exp_health.json", function(error, data) {
          if (error) throw error;
              MakeScatter(data)
          })
    })

  EDUCButton.on("click", function() {
      d3.selectAll(".dot2").remove();
      d3.selectAll("text.scattertitle2").remove();
      d3.selectAll("text.scattersubtitle2").remove();
      d3.selectAll("text.xtext2").remove();
      d3.selectAll("text.ytext2").remove();

      // Produce new scatterplot:
      d3.json("gov_exp_educ.json", function(error, data) {
          if (error) throw error;
              MakeScatter(data)
          })
    })
 }
  
  
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
    

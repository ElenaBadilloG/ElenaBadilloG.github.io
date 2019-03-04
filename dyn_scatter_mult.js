/* global d3 */

// Syntax for error-handling using fetch from: https://gist.github.com/odewahn/5a5eeb23279eed6a80d7798fdb47fe91
document.addEventListener('DOMContentLoaded', () => {
  fetch("fulldf.json")
    .then( response => {
    return response.json()              
  })
    .then(data => ReverseScatter(data))
  });

function ReverseScatter(data) {
  
// Basic plot configurations
  const height = 700;
  const width = 800;
  const margin = {top: 120, left: 80, right: 70, bottom: 80};

  const plotWidth = width - margin.right - margin.left;
  const plotHeight = height - 2*margin.top;
  const colorRange = ['#12939A', '#79C7E3', '#1A3177', '#FF9833', '#af77d0'];
  const countries = data.map((row) => {return row.COUNTRY});
  const regions = data.map((row) => {return row.Region}); 
  const regs = Array.from(new Set(regions))
  const color = d3.scaleOrdinal().domain(regions).range(colorRange);
  const textWidth = 30;
  // legend position parameters
  const leg_y = 160; 
  const leg_x = 120
  const yaxden = 1.5
  const yaxsp = 3.2

  const xaxden = 1.3
  const xaxsp = 560

// Domain, Range, and Scales
  var xD = data.reduce((d, row) => {
    return {min: Math.min(row.Tax, d.min), max: Math.max(row.Tax, d.max)
    };
  }, {min: Infinity, max: -Infinity});

  var yD = data.reduce((d, row) => {
    return {min: Math.min(row.LFP_W, d.min), max: Math.max(row.LFP_W, d.max)
    };
  }, {min: Infinity, max: -Infinity});

  var x = d3.scaleLinear().domain([0, xD.max+10])
    .range([plotHeight, margin.top]).nice();

  var y = d3.scaleLinear().domain([yD.max+10, 0])
  .range([plotHeight, margin.top]).nice();

  var svg = d3.select('#dynscatter').append('svg')
    .attr('width', plotWidth).attr('height', plotHeight);

  // Produce scatterplot:
  svg.selectAll(".dot")
      .data(data)
      .enter().append("circle")
      .attr("r", 4) //radius for every dot
      .attr("cx", function(d) {return x(d.Tax); }) // map each center circle (x,y) to tax, LFP pairs in the data
      .attr("cy", function(d) {return y(d.LFP_W);})
      .attr('opacity', 0.85)
      .attr('fill', d => color(d.Region));

  // Add X,Y axes with origin in the upper right corner:
  svg.append('g')
    .call(d3.axisBottom(x))
    .attr('transform', `translate(${-10}, 115)`);

  svg.append("g")
      .call(d3.axisLeft(y))
      .attr('transform', `translate(${plotHeight+22}, 15)`);

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
      .attr("y", plotHeight/2 + yaxsp*margin.left)
      .attr("x", 0 - (plotHeight / yaxden))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
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
     .text("Countries with a higher female LFP have, on average, larger public sectors (higher taxation)")            
     .attr("text-anchor", "middle")
     .attr("dx", ".5em")
     .attr("dy", "1.5em")
     .attr('class', 'scattersubtitle')
     .attr('font-size', 15)
     .attr('stroke', '#799c94')
     .attr('opacity', 0.85)
     .call(wrap, 1);

  // Add source caption
  svg.append("text")             
    .attr("transform",
          "translate(" + (width-420) + " ," + 
                         (margin.top + 335) + ")")
    .style("text-anchor", "middle")
    .text('Source: OECD Statistics, 2015')
    .attr('class', 'source')
    .attr('font-size', 11);

  // Add legend
  const legend = svg.selectAll('.rect').data(regs);
  legend.enter()
  .append('rect')
  .attr('class', 'rect')
  .attr("x", function(d, i) {return leg_x;})
  .attr("y", function(d, i) {return (i * 20) + leg_y;})
  .attr('height', 20)
  .attr('width', 20)
  .attr('fill', function(d, i) {return color(i);});

  // legend texts
  const leg_txt = svg.selectAll(null).data(regs);
    leg_txt.enter()
    .append('text')
    .attr('class', 'leg_text')
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

    //Create Gender Gap button
    var xbut = 75
    var ybut = 5
    var GWGButton = svg.append("g")
      .attr("id", "GWGButton")
      .attr("opacity", 10)
      .classed("unclickable", true) //Initially not clickable
      .attr("transform", "translate(" + x.range()[0] + "," + y.range()[1] + ")");
    
    GWGButton.append("rect")
      .attr("x", xbut)
      .attr("y", ybut-15)
      .attr("width", 125)
      .attr("height", 25);
    
    GWGButton.append("text")
      .attr("x", xbut+2)
      .attr("y", ybut)
      .html(" Gender Wage Gap ");
    
    //Define click behavior

    GWGButton.on("click", function() {
      d3.selectAll(".dot").remove();
      d3.selectAll("text.scattertitle").remove();
      d3.selectAll("text.scattersubtitle").remove();
      d3.selectAll("text.xtext").remove();
      d3.selectAll("text.scatterytext").remove();

      // Produce new scatterplot:
      updateToGW()

  /************ UPDATE 1 **************************/

  function updateToGW() {  
  

  //Update all circles
  d3.select('#dynscatter').selectAll("circle")
    .data(data)
    .transition()
    .duration(10)
    .attr("cx", function(d) {
      return x(d.Gap);
    })
    .attr("cy", function(d) {
      return y(d.LFP_W);
    })
    .attr('fill', d => color(d.Region));


  svg.append("text")             
      .attr("transform",
            "translate(" + (width-xaxsp) + " ," + 
                           (margin.top/xaxden) + ")")
      .attr("dx", "1em")
      .style("text-anchor", "middle")
      .attr("class", "xtext")
      .text("Gender Wage Gap (%) ");

  // text label for the y axis
  svg.append("text")             
      .attr("transform", "rotate(-90)")
      .attr("y", plotHeight/2 + yaxsp*margin.left)
      .attr("x", 0 - (plotHeight / yaxden))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text(" Female Labor Participation (%) ");

  // Add title
  svg.append("text")             
    .attr("transform",
          "translate(" + (width-540) + " ," + 
                         (margin.top-95) + ")")
    .style("text-anchor", "middle")
    .text("Gender Wage Gap and \n Female Labor Participation")
    .attr('font-size', 20)
    .attr('class', 'scattertitle')
    .attr('font-weight', "bold")

    // Add subtitle:
    svg.append("g").attr("transform", "translate(260, 30)")
     .append("text")
     .text("No clear relationship between gender wage gap and female LFP...")            
     .attr("text-anchor", "middle")
     .attr("dx", ".5em")
     .attr("dy", "1.5em")
     .attr('class', 'scattersubtitle')
     .attr('font-size', 15)
     .attr('stroke', '#799c94')
     .attr('opacity', 0.85)
     .call(wrap, 1);

}
});

    //Create Job Quality button
    var xJQbut = 75
    var yJQbut = 45
    var JQButton = svg.append("g")
      .attr("id", "JQButton")
      .attr("opacity", 10)
      .classed("unclickable", true) //Initially not clickable
      .attr("transform", "translate(" + x.range()[0] + "," + y.range()[1] + ")");
    
    JQButton.append("rect")
      .attr("x", xJQbut)
      .attr("y", yJQbut-15)
      .attr("width", 125)
      .attr("height", 25);
    
    JQButton.append("text")
      .attr("x", xJQbut+2)
      .attr("y", yJQbut)
      .html(" Job Quality ");
    
    //Define click behavior

    JQButton.on("click", function() {
      d3.selectAll(".dot").remove();
      d3.selectAll("text.scattertitle").remove();
      d3.selectAll("text.scattersubtitle").remove();
      d3.selectAll("text.xtext").remove();
      d3.selectAll("text.ytext").remove();

      // Produce new scatterplot:
      updateToJQ()

  /************ UPDATE 1 **************************/

  function updateToJQ() {  
  

  //Update all circles
  d3.select('#dynscatter').selectAll("circle")
    .data(data)
    .transition()
    .duration(10)
    .attr("cx", function(d) {
      return x(d.JobQuality);
    })
    .attr("cy", function(d) {
      return y(d.LFP_W);
    })
    .attr('fill', d => color(d.Region));


  // text label for the x axis
  svg.append("text")             
      .attr("transform",
            "translate(" + (width-xaxsp) + " ," + 
                           (margin.top/xaxden) + ")")
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .attr('class', 'xtext')
      .text(" Job Quality (%) ");

  // Add title
  svg.append("text")             
    .attr("transform",
          "translate(" + (width-540) + " ," + 
                         (margin.top-95) + ")")
    .style("text-anchor", "middle")
    .text("Job Quality and \n Female Labor Participation")
    .attr('font-size', 20)
    .attr('class', 'scattertitle')
    .attr('font-weight', "bold")

    // Add subtitle:
    svg.append("g").attr("transform", "translate(260, 30)")
     .append("text")
     .text("Higher female LFP seems correlated with better jobs...")            
     .attr("text-anchor", "middle")
     .attr("dx", ".5em")
     .attr("dy", "1.5em")
     .attr('class', 'scattersubtitle')
     .attr('font-size', 15)
     .attr('stroke', '#799c94')
     .attr('opacity', 0.85)
     .call(wrap, 1);

}
});

    //Create Household Income button
    var xIncbut = 75
    var yIncbut = 65

    var IncButton = svg.append("g")
      .attr("id", "IncButton")
      .attr("opacity", 10)
      .classed("unclickable", true) //Initially not clickable
      .attr("transform", "translate(" + x.range()[0] + "," + y.range()[1] + ")");
    
    IncButton.append("rect")
      .attr("x", xIncbut)
      .attr("y", yIncbut)
      .attr("width", 125)
      .attr("height", 25);
    
    IncButton.append("text")
      .attr("x", xIncbut+2)
      .attr("y", yIncbut+15)
      .html(" Household Income");
    
    //Define click behavior

    IncButton.on("click", function() {
      d3.selectAll(".dot").remove();
      d3.selectAll("text.scattertitle").remove();
      d3.selectAll("text.scattersubtitle").remove();
      d3.selectAll("text.xtext").remove();
      d3.selectAll("text.ytext").remove();

      // Produce new scatterplot:
      updateToInc()

  /************ UPDATE 3 **************************/

  function updateToInc() {  
  
  //Update all circles
  d3.select('#dynscatter').selectAll("circle")
    .data(data)
    .transition()
    .duration(10)
    .attr("cx", function(d) {
      return x(d.Inc);
    })
    .attr("cy", function(d) {
      return y(d.LFP_W);
    })
    .attr('fill', d => color(d.Region));


  // text label for the x axis
  svg.append("text")             
      .attr("transform",
            "translate(" + (width-xaxsp) + " ," + 
                           (margin.top/xaxden) + ")")
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .attr('class', 'xtext')
      .text(" Household Income (Thousands of USD) ");

  // text label for the y axis
  svg.append("text")             
      .attr("transform", "rotate(-90)")
      .attr("y", plotHeight/2 + yaxsp*margin.left)
      .attr("x", 0 - (plotHeight / yaxden))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text(" Female Labor Participation (%) ");

  // Add title
  svg.append("text")             
    .attr("transform",
          "translate(" + (width-540) + " ," + 
                         (margin.top-95) + ")")
    .style("text-anchor", "middle")
    .text("Household Income and \n Female Labor Participation")
    .attr('font-size', 20)
    .attr('class', 'scattertitle')
    .attr('font-weight', "bold")

    // Add subtitle:
    svg.append("g").attr("transform", "translate(260, 30)")
     .append("text")
     .text("Even after (higher) taxes, households in countries with more female LFP are, on average, wealthier")            
     .attr("text-anchor", "middle")
     .attr("dx", ".5em")
     .attr("dy", "1.5em")
     .attr('class', 'scattersubtitle')
     .attr('font-size', 15)
     .attr('stroke', '#799c94')
     .attr('opacity', 0.85)
     .call(wrap, 1);

}
});


};


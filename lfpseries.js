/* global d3 */
      /* Add SVG */
var svg = d3.select("#lfptime").append("svg")
        .attr("width", (700+180)+"px")
        .attr("height", (450+90)+"px")
        .append('g')
        .attr("transform", `translate(${90}, ${90})`);

// Syntax for error-handling using fetch from: https://gist.github.com/odewahn/5a5eeb23279eed6a80d7798fdb47fe91
document.addEventListener('DOMContentLoaded', () => {
  fetch('./lfpGap.json')
    .then(response => response.json()
  )
    .then(data => MovingLFPSeries(data, "Country"))
  });

function MovingLFPSeries(dataset, v) {


    var data = d3.nest()
                 .key(function(d) { return d[v]; })
                 .entries(dataset);
      
      const colorRange = ['#12939A', '#79C7E3', '#1A3177', '#FF9833', '#af77d0'];
      const regions = dataset.map((row) => {return row.Region}); 
      const regs = Array.from(new Set(regions))
      //console.log(regs)
      const Regcolor = d3.scaleOrdinal().domain(regs).range(colorRange);
      //console.log(Regcolor('Rest'))

      var width = 700;
      var height = 450;
      var margin = 90;
      var duration = 250;

        // legend position parameters
      var leg_y = 50; 
      var leg_x = 670
      


      var lineOpacity = "0.75";
      var lineOpacityHover = "0.85";
      var otherLinesOpacityHover = "0.1";
      var lineStroke = "1.35px";
      var lineStrokeHover = "2.15px";

      var circleOpacity = '0.85';
      var circleOpacityOnLineHover = "0.25"
      var circleRadius = 3;
      var circleRadiusHover = 6;

      /* Scale */
      var xScale = d3.scaleLinear()
        .domain(d3.extent(data[0].values, d => d.Time))
        .range([0, width-margin]);

      var yScale = d3.scaleLinear()
        //.domain([0,100])
        .domain([20, 100])
        .range([height-margin, 0]);


      /* Add line into SVG */
      var line = d3.line()
        .x(d => xScale(d.Time))
        .y(d => yScale(d.FLFP))
         .curve(d3.curveBasis);

      var lines = svg.append('g')
        .attr('class', 'lines');

      var tooltip = d3.select("body")
          .append("div")
          .attr('class', 'tooltip');

      lines.selectAll('.line-group')
        .data(data)
        .enter()
        .append('g')
        .attr('class', 'line-group')  

        .append('path')
        .attr('class', 'line')
        .attr('d', d => line(d.values))
        .style('stroke', (d, i) => Regcolor(i))
        .style('opacity', lineOpacity)
        .on("mouseover", function(d, i) {
        
          // tooltip
           // d3.select(this)
           tooltip
            .style("visibility", "visible")
            .text(d.key)
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px")
            .style("background-color", Regcolor(d.key)),

            d3.selectAll('.line')
                .style('opacity', otherLinesOpacityHover);
            d3.select(this)
              .style('opacity', lineOpacityHover)
              .style("stroke-width", lineStrokeHover)
              .style("cursor", "pointer");
          })
        .on("mouseout", function(d) {

            tooltip.style("visibility", "hidden"),
            d3.selectAll(".line")
                .style('opacity', lineOpacity);
            d3.select(this)
              .style("stroke-width", lineStroke)
              .style("cursor", "none");
          });

        // Add legend
            const legend = svg.selectAll('.rect')
            .data(regs);
            legend.enter()
            .append('rect')
            .attr('class', 'legrect')
            .attr("x", function(d, i) {return leg_x;})
            .attr("y", function(d, i) {return (i * 20) + leg_y;})
            .attr('height', 20)
            .attr('width', 20)
            .attr('fill', function(d, i) {return Regcolor(i);});
            // legend texts
            const legTxt = svg.selectAll(null).data(regs);
              legTxt.enter()
              .append('text')
              .attr('class', 'legTextTS')
              .attr("x", function(d, i) {return leg_x+25;})
              .attr("y", function(d, i) {return (i * 20 + leg_y+15);})
              .attr('font-size', 14)
              .text(String);

      /* Add Axis into SVG */
      var xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d")).ticks(10);
      var yAxis = d3.axisLeft(yScale).ticks(10);

      svg.append("g")
        .attr("class", "x_axis")
        .attr("transform", `translate(0, ${height-margin})`)
        .call(xAxis);

      svg.append("g")
        .attr("class", "y_axis")
        .call(yAxis)
        .append('text')
        .attr("y", -35)
        .attr("x",-90)
        .attr("transform", "rotate(-90)")
        .attr("fill", "#000")
        .attr("font-family",  "Garamond")
        .attr('font-size', 16)
        .text("Female LFP (%)");

      // Add title
      svg.append("text").attr("transform", "translate(180, -60)")
        .style("text-anchor", "middle")
        .text("Female Labor Participation Over Time")
        .attr('font-size', 20)
        .attr('class', 'title')
        .attr('font-weight', "bold");

      // Add subtitle:
        svg.append("g").attr("transform", "translate(290, -60)")
         .append("text")
         .text("Female LFP has increased in all regions accross OECD countries since the 80's. But it has been especially high in Nordic countries.")            
         .attr("text-anchor", "middle")
         .attr("dx", ".5em")
         .attr("dy", "1.5em")
         .attr('class', 'scattersubtitle')
         .call(wrap, 1);

        // Add source caption
  svg.append("text")             
    .attr("transform", "translate(490, 400)")
    .style("text-anchor", "middle")
    .text('Source: OECD Statistics, 1980-2017')
    .attr('class', 'source')
    .attr('font-size', 12);


    transition(d3.selectAll("path")) //animate series
   

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
    }


  //Create  button
    var xbut = 400
    var ybut = 5

    var AvgButton = svg.append("g")
      .attr("id", "Button")
      .attr("class", "RoundedButtonTS")
      .attr("opacity", 10)
      .attr('class', "unclickable RoundedButtonTS") 
      //.attr("transform", "translate(" + x.range()[0] + "," + y.range()[1] + ")");
    
    AvgButton.append("rect")
      .attr("x", xbut)
      .attr("y", ybut)
      .attr("width", 215)
      .attr("height", 30);
    
    AvgButton.append("text")
      .attr("x", xbut+5)
      .attr("y", ybut+19)
      .html("Aggregate Female LFP By Region");
    
    //Define click behavior

    AvgButton.on("click", function() {
      d3.selectAll(".line").remove();
      d3.selectAll(".legrect").remove();
      d3.selectAll(".legTextTS").remove();
      d3.selectAll(".RoundedButtonTS").remove();

   //Create  By Country button

    var BckButton = svg.append("g")
      .attr("id", "Button")
      .attr("class", "RoundedButtonTS")
      .attr("opacity", 10)
      .classed("unclickable", true) //Initially not clickable
    
    BckButton.append("rect")
      .attr("x", xbut)
      .attr("y", ybut)
      .attr("width", 192)
      .attr("height", 30);
    
    BckButton.append("text")
      .attr("x", xbut+5)
      .attr("y", ybut+19)
      .html("Female LFP By Country");
    
    //Define click behavior

    BckButton.on("click", function() {
      d3.selectAll(".line").remove();
      d3.selectAll(".legrect").remove();
      d3.selectAll(".legTextTS").remove();
      d3.selectAll(".RoundedButtonTS").remove();

  var AvgButton = svg.append("g")
      .attr("id", "Button")
      .attr("border-radius", 12)
      .attr("class", "RoundedButtonTS")
      .attr("opacity", 10)
      .classed("unclickable", true) //Initially not clickable
      //.attr("transform", "translate(" + x.range()[0] + "," + y.range()[1] + ")");
    
    AvgButton.append("rect")
      .attr("x", xbut)
      .attr("y", ybut)
      .attr("width", 192)
      .attr("height", 30);
    
    AvgButton.append("text")
      .attr("x", xbut+5)
      .attr("y", ybut+19)
      .html("Aggregate Female LFP By Region");

      // Produce new scatterplot:
      d3.json("lfpGap.json", function(error, data) {
          if (error) throw error;
              MovingLFPSeries(data,  "Country")
          })
    });

      // Produce new scatterplot:
      d3.json("av_lfp.json", function(error, data) {
          if (error) throw error;
              MovingLFPSeries(data, "Region")
          })
    });


  // Animation snippet.  ref: https://codepen.io/anon/pen/ERrqmp?editors=0010
  function tweenDash() { 
      var l = this.getTotalLength(),
        i = d3.interpolateString("0," + l, l + "," + l);
      return function (t) { return i(t); };
    }
      function transition(selection) {
      selection.each(function(){
       d3.select(this).transition()
        .duration(3000)
        .attrTween("stroke-dasharray", tweenDash);
      })
    }
        
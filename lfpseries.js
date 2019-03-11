/* global d3 */

// Syntax for error-handling using fetch from: https://gist.github.com/odewahn/5a5eeb23279eed6a80d7798fdb47fe91
document.addEventListener('DOMContentLoaded', () => {
  // this uses a structure called a promise to asyncronously get the cars data set
  fetch('./lfpGap.json')
    .then(response => response.json()  //we only get here if there is no error
  )
    // now that the data is actually understood as json we send it to your function
    .then(data => MovingLFPSeries(data))
  });

function MovingLFPSeries(dataset) {

//Width and height

    var data = d3.nest()
                 .key(function(d) { return d.Region; })
                 .entries(dataset);
      
      const colorRange = ['#12939A', '#79C7E3', '#1A3177', '#FF9833', '#af77d0'];
      const countries = dataset.map((row) => {return row.Country});
      const regions = dataset.map((row) => {return row.Region}); 
      const regs = Array.from(new Set(regions))
      const Regcolor = d3.scaleOrdinal().domain(regions).range(colorRange);

      var width = 700;
      var height = 450;
      var margin = 90;
      var duration = 250;

        // legend position parameters
      const leg_y = 250; 
      const leg_x = 90


      var lineOpacity = "0.45";
      var lineOpacityHover = "0.85";
      var otherLinesOpacityHover = "0.1";
      var lineStroke = "1.25px";
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
        .domain([0, d3.max(data[0].values, d => d.FLFP)])
        .range([height-margin, 0]);

      /* Add SVG */
      var svg = d3.select("#lfptime").append("svg")
        .attr("width", (width+margin)+"px")
        .attr("height", (height+margin)+"px")
        .append('g')
        .attr("transform", `translate(${margin}, ${margin})`);


      /* Add line into SVG */
      var line = d3.line()
        .x(d => xScale(d.Time))
        .y(d => yScale(d.FLFP));

      let lines = svg.append('g')
        .attr('class', 'lines');

      lines.selectAll('.line-group')
        .data(data).enter()
        .append('g')
        .attr('class', 'line-group')  
        .on("mouseover", function(d, i) {
            svg.append("text")
              .attr("class", "title-text")
              .style("fill", Regcolor(i))        
              .text(d.name)
              .attr("text-anchor", "middle")
              .attr("x", (width-margin)/2)
              .attr("y", 5);
          })
        .on("mouseout", function(d) {
            svg.select(".title-text").remove();
          })
        .append('path')
        .attr('class', 'line')  
        .attr('d', d => line(d.values))
        .style('stroke', (d, i) => Regcolor(i))
        .style('opacity', lineOpacity)
        .on("mouseover", function(d) {
            d3.selectAll('.line')
                .style('opacity', otherLinesOpacityHover);
            d3.selectAll('.circle')
                .style('opacity', circleOpacityOnLineHover);
            d3.select(this)
              .style('opacity', lineOpacityHover)
              .style("stroke-width", lineStrokeHover)
              .style("cursor", "pointer");
          })
        .on("mouseout", function(d) {
            d3.selectAll(".line")
                .style('opacity', lineOpacity);
            d3.select(this)
              .style("stroke-width", lineStroke)
              .style("cursor", "none");
          });

        // Add legend
            const legend = svg.selectAll('.rect').data(regs);
            legend.enter()
            .append('rect')
            .attr('class', 'rect')
            .attr("x", function(d, i) {return leg_x;})
            .attr("y", function(d, i) {return (i * 20) + leg_y;})
            .attr('height', 20)
            .attr('width', 20)
            .attr('fill', function(d, i) {return Regcolor(i);});
            // legend texts
            const legTxt = svg.selectAll(null).data(regs);
              legTxt.enter()
              .append('text')
              .attr('class', 'legText')
              .attr("x", function(d, i) {return leg_x+25;})
              .attr("y", function(d, i) {return (i * 20 + leg_y+15);})
              .attr('font-size', 14)
              .text(String);

      /* Add Axis into SVG */
      var xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d")).ticks(10);
      var yAxis = d3.axisLeft(yScale).ticks(10);

      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0, ${height-margin})`)
        .call(xAxis);

      svg.append("g")
        .attr("class", "y axis")
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
         .attr('class', 'subtitle')
         .attr('font-size', 15)
         .attr('stroke', '#799c94')
         .attr('opacity', 0.85)
         .call(wrap, 1);

        // Add source caption
  svg.append("text")             
    .attr("transform", "translate(490, 400)")
    .style("text-anchor", "middle")
    .text('Source: OECD Statistics, 1980-2017')
    .attr('class', 'source')
    .attr('font-size', 11);

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
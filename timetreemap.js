
// Treemap

'use strict';
'use strict';

const margin = {top: 20, right: 10, bottom: 0, left: 5},
      width = 1050 - margin.left - margin.right,
      height = 550 - margin.top - margin.bottom,
      colorRange = ['#D49A8C', '#A6C1C1']
const color = d3.scaleOrdinal().domain([-1,1]).range(colorRange);
const opScale = d3.scaleSequential(d3.interpolateGreys)
    .domain([1, 50])

 // legend position parameters
const leg_y = 20; 
const leg_x = 50
const transDur = 1500

const treemap = d3.treemap().size([width, height]);

const div = d3.select("#timetreemap").append("div")
    .style("position", "relative")
    .style("width", (width + margin.left + margin.right) + "px")
    .style("height", (height + margin.top + margin.bottom) + "px")
    .style("left", margin.left + "px")
    .style("top", margin.top + "px");

function MakeTree(data) {
	d3.selectAll(".leg_holder").remove();
	d3.selectAll(".node").remove();
    d3.selectAll(".leg").remove();
    d3.selectAll(".leg_text").remove();
    d3.selectAll(".leg_op").remove();
    d3.selectAll('leg_txt_op').remove();

    function createNestingFunction(propertyName){ // Helper function. ref: https://stackoverflow.com/questions/31723061/add-attribute-with-nested-entries-in-d3-js
    return function(d){ 
              return d[propertyName];
           };
    }

    const gender = data.map((row) => {return row.Sex}); 
    const genr = Array.from(new Set(gender))
    const expend = data.map((row) => {return row.FamilySpending}); 
    const exp = Array.from(new Set(expend))
    const expd = exp.sort(d3.ascending)

	// Add legend

	var svg = d3.select("#treelegend").append("svg")
                .attr("width", 600)
                .attr("height", 80)
                .attr("class", "leg_holder");

	var legend = svg.selectAll(".leg_holder")
		  .data(genr)
		  .enter()
		  .append('rect')
		  .attr('class', 'leg')
		  .attr("x", function(d, i) {return leg_x;})
		  .attr("y", function(d, i) {return (i * 20) + leg_y;})
		  .attr('height', 20)
		  .attr('width', 60)
		  .attr('fill', function(d) {return color(d);})
		  .attr('opacity', 0.75);

	 // legend texts
	var leg_txt = svg.selectAll('.rect').data(genr);
	    leg_txt.enter()
	    .append('text')
	    .attr('class', 'leg_text')
	    .attr("x", function(d, i) {return leg_x+65;})
	    .attr("y", function(d, i) {return (i * 20 + leg_y+12);})
	    .attr('font-size', 14)
	    .text(String);

	 // Opacity Legend. (FamExpend)

	var legendOP = svg.selectAll(".leg_holder")
		  .data(expd)
		  .enter()
		  .append('rect')
		  .attr('class', 'leg_op')
		  .attr("x", function(d, i) {return (i * 5) + leg_x + 180;})
		  .attr("y", function(d, i) {return leg_y;})
		  .attr('height', 30)
		  .attr('width', 10)
		  .style("fill", function(d, i ) { return opScale(d);});

    // Add subtitle:
    svg.append("g").attr("transform", "translate(290, 55)")
     .append("text")
     .attr('class', 'leg_txt_op')
     .text("Family Program Expenditures (% Public Expenditures)")            
     .attr("dx", "-1.5em")
     .attr("dy", "1.5em")
     .attr('font-size', 14);


    var xScale = d3.scaleLinear()
        .domain([10, 40]) 
        .range([0.15, 1]);

    var levels = ['Sex', 'Country']

    var nest = d3.nest();
    for (var i = 0; i < levels.length; i++) {
        nest = nest.key( createNestingFunction(levels[i]) );
    }

    var tr = {
          "key":"root", 
          "values": nest.entries(data) // nest all nodes
        }

    const root = d3.hierarchy(tr, (d) => d.values)
      .sum((d) => d.hours);

    const tree = treemap(root);

    const node = div.datum(root).selectAll(".node")
        .data(tree.leaves())
        .enter().append("div")
        .transition()
    	.duration(transDur)
    	//.ease(d3.easeLinear)
        .attr("class", "node")
        .style("left", (d) => d.x0 + "px")
        .style("top", (d) => d.y0 + "px")
        .style("width", (d) => Math.max(0, d.x1 - d.x0 - 1) + "px")
        .style("height", (d) => Math.max(0, d.y1 - d.y0  - 1) + "px")
        .style("background", (d) => color(d.data.Sex))
        .style("opacity", (d) => xScale(d.data.FamilySpending))
        .text((d) => (d.data.Country + '\n'+'\n'+'\n'+ Math.round(d.data.hours*10)/10));

      }

d3.json("treetimeUNP.json", function(error, data) {
  if (error) throw error;
      MakeTree(data)
  })

// BUTTON INPUT CHANGES

d3.selectAll("#PSinput").on("change", function change() {

    d3.json("treetimePS.json", function(error, data) {
    if (error) throw error;

      MakeTree(data)})
   })

d3.selectAll("#LSinput").on("change", function change() {

    d3.json("treetimeLS.json", function(error, data) {
    if (error) throw error;

      MakeTree(data)})
  })

d3.selectAll("#UNPinput").on("change", function change() {

    d3.json("treetimeUNP.json", function(error, data) {
    if (error) throw error;

      MakeTree(data)})})






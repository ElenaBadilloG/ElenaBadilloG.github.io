
var dataset;

var vMap= {'Social transfers/benefits':"gov_exp_socALL.json",
             'Economic Affairs':"gov_exp_econALL.json",
             'Health': 'gov_exp_recALL.json',
             'Safety':'gov_exp_safeALL', 
             'Defense': 'gov_exp_defALL.json',
             'Public order and safety':'gov_exp_safeALL.json',
             'Education':'gov_exp_educALL.json',
             'Environment protection':'gov_exp_envALL.json',
             'Housing and community amenities':'gov_exp_houseALL.json',
             'Recreation/culture': 'gov_exp_recALL.json'};


var labelArea = 160;
    var chart,
            wid = 400,
            bar_height = 50,
            hei = bar_height + 500;
    var rightOffset = wid + labelArea;

    var xFrom = d3.scaleLinear()
            .range([0, wid]);
    var xTo = d3.scaleLinear()
            .range([0, wid]);
    var y = d3.scaleBand()
            .range([20, hei]);

    function MakeChart(data) { // took some code structure from:  https://bl.ocks.org/kaijiezhou/bac86244017c850034fe

        var data = data.filter(function(d) {
          return Math.round(d.Time) == Math.round(1996)});

        data.sort(function(a, b){ // sort by lfp gap

            return a["lfp_gap"]-b["lfp_gap"];
        });
        var chart = d3.select("#govdens")
                .append('svg')
                .attr('class', 'barchart')
                .attr('width', labelArea + wid + wid)
                .attr('height', hei);
        const colorRange = ['#12939A', '#79C7E3', '#1A3177', '#FF9833', '#af77d0'];
        const regions = data.map((row) => {return row.Region}); 
        const regs = Array.from(new Set(regions))
        const Regcolor = d3.scaleOrdinal().domain(regions).range(colorRange);


        xFrom.domain(d3.extent(data, function (d) {
            return d.lfp_gap;
        }));
        xTo.domain(d3.extent(data, function (d) {
            return d.Expend;
        }));

        y.domain(data.map(function (d) {
            return d.Country;
        }));

        var yPosByIndex = function (d) {
            return y(d.Country);

        };
          var tooltip = d3.select("body")
          .append("div")
          .attr('class', 'tooltip');

        chart.selectAll("rect.left")
                .data(data)
                .enter().append("rect")
                .attr("x", function (d) {
                    return wid - xFrom(d.lfp_gap);
                })
                .attr("y", yPosByIndex)
                .attr("class", "left")
                .attr("width", function (d) {
                    return xFrom(d.lfp_gap);
                })
                .attr("height", y.bandwidth())
                .attr('fill', d => Regcolor(d.Region))
                .attr("opacity", 0.75)
                .on("mouseover", function(d) { return tooltip.style("visibility", "visible").text(d.lfp_gap).style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px").style("background-color", Regcolor(d.Region)), d3.select(this).attr("opacity", 1)})
                .on("mouseout", function() { return tooltip.style("visibility", "hidden"), d3.select(this).attr("opacity", 0.75)});
                        

        chart.selectAll("text.name")
                .data(data)
                .enter().append("text")
                .attr("x", (labelArea / 2) + wid)
                .attr("y", function (d) {
                    return y(d.Country) + y.bandwidth() / 2;
                })
                .attr("dy", ".20em")
                .attr("text-anchor", "middle")
                .attr('class', 'name')
                .attr('fill', d => Regcolor(d.Region))
                .text(function(d){return d.Country;});

        
        var bars = chart.selectAll("rect.right")
                .data(data);
                bars.enter().append("rect")
                .attr("x", rightOffset)
                .attr("y", yPosByIndex)
                .attr("class", "right")
                .attr("width", function (d) {
                    return xTo(d.Expend);
                })
                .attr("height", y.bandwidth())
                .attr('fill', d => Regcolor(d.Region))
                .attr("opacity", 0.75)
                .on("mouseover", function(d) { return tooltip.style("visibility", "visible").text(d.Expend).style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px").style("background-color", Regcolor(d.Region)), d3.select(this).attr("opacity", 1)})
                .on("mouseout", function() { return tooltip.style("visibility", "hidden"), d3.select(this).attr("opacity", 0.75)})
                                .transition()

                chart.append("text").attr("x",wid/3).attr("y", 10).attr("class","title").text("Gender LFP Gap (%)");
                chart.append("text").attr("x",wid/4+rightOffset).attr("y", 10).attr("class", "title").text("Public Expenditure by Type (% Total Exp)");
                chart.append("text").attr("x",wid+labelArea/3).attr("y", 10).attr("class", "title").text("Country");

    ////////// Add slider //////////

                var slidwid = 800
                var slidhei = 260       

                var svgSlider = d3.select("#slider")
                    .append("svg")
                    .attr("class", "slid")
                    .attr("width", slidwid + 60)
                    .attr("height", slidhei);
                    
                var x = d3.scaleLinear()
                    .domain([1996, 2017])
                    .range([0, slidwid])
                    .clamp(true);

                var slider = svgSlider.append("g")
                    .attr("class", "slider")
                    .attr("transform", "translate(" + 40 + "," + slidhei / 2 + ")");

                slider.append("line")
                    .attr("class", "track")
                    .attr("x1", x.range()[0])
                    .attr("x2", x.range()[1])
                    .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
                    .attr("class", "track-inset")
                    .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
                    .attr("class", "track-overlay")
                    .call(d3.drag()
                        .on("start.interrupt", function() { slider.interrupt(); })
                        .on("start drag", function() {update(x.invert(d3.event.x)); }));

                slider.insert("g", ".track-overlay")
                    .attr("class", "ticks")
                    .attr("transform", "translate(0," + 28 + ")")
                  .selectAll("text")
                    .data(x.ticks(15))
                    .enter()
                    .append("text")
                    .attr("x", x)
                    .attr("y", 15)
                    .attr("text-anchor", "middle")
                    .text(function(d) { return d; });

                var handle = slider.insert("circle", ".track-overlay")
                    .attr("class", "handle")
                    .attr("r", 9);

                var label = slider.append("text")  
                    .attr("class", "label")
                    .attr("text-anchor", "middle")
                    .attr("x", 50)
                    .text("Start: 1996")
                    .attr("transform", "translate(-15," + (-15) + ")")

        

      function update(h) {

        d3.selectAll(".barchart").remove();
        d3.selectAll(".left").remove();
        d3.selectAll(".right").remove();
        d3.selectAll(".name").remove();
        d3.selectAll(".title").remove();
        d3.selectAll(".text").remove();

          // filter according to slider scale
        handle.attr("cx", x(h));
        label.attr("x", x(h));

        // filter data set and redraw plot
        var newData = dataset.filter(function(d) {
          return Math.round(d.Time) == Math.round(h);
        })
        
        const colorRange = ['#12939A', '#79C7E3', '#1A3177', '#FF9833', '#af77d0'];
        const regions = newData.map((row) => {return row.Region}); 
        const regs = Array.from(new Set(regions))
        const Regcolor = d3.scaleOrdinal().domain(regions).range(colorRange);


        newData.sort(function(a, b){ // sort by lfp gap
            return a["lfp_gap"]-b["lfp_gap"];
        });
        var chart = d3.select("#govdens")
                .append('svg')
                .attr('class', 'barchart')
                .attr('width', labelArea + wid + wid)
                .attr('height', hei);

        xFrom.domain(d3.extent(newData, function (d) {
            return d.lfp_gap;
        }));
        xTo.domain(d3.extent(newData, function (d) {
            return d.Expend;
        }));

        y.domain(newData.map(function (d) {
            return d.Country;
        }));

        var yPosByIndex = function (d) {
            return y(d.Country);

        };
          var tooltip = d3.select("body")
          .append("div")
          .attr('class', 'tooltip');

        chart.selectAll("rect.left")
                .data(newData)
                .enter().append("rect")
                .attr("x", function (d) {
                    return wid - xFrom(d.lfp_gap);
                })
                .attr("y", yPosByIndex)
                .attr("class", "left")
                .attr("width", function (d) {
                    return xFrom(d.lfp_gap);
                })
                .attr("height", y.bandwidth())
                .attr('fill', d => Regcolor(d.Region))
                .attr("opacity", 0.75)
                .on("mouseover", function(d) { return tooltip.style("visibility", "visible").text(d.lfp_gap).style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px").style("background-color", Regcolor(d.Region)), d3.select(this).attr("opacity", 1)})
                .on("mouseout", function() { return tooltip.style("visibility", "hidden"), d3.select(this).attr("opacity", 0.75)});
                        
        chart.selectAll("text.name")
                .data(newData)
                .enter().append("text")
                .attr("x", (labelArea / 2) + wid)
                .attr("y", function (d) {
                    return y(d.Country) + y.bandwidth() / 2;
                })
                .attr("dy", ".20em")
                .attr("text-anchor", "middle")
                .attr('class', 'name')
                .attr('fill', d => Regcolor(d.Region))
                .text(function(d){return d.Country;});
        
        var bars = chart.selectAll("rect.right")
                .data(newData);
                bars.enter().append("rect")
                .attr("x", rightOffset)
                .attr("y", yPosByIndex)
                .attr("class", "right")
                .attr("width", function (d) {
                    return xTo(d.Expend);
                })
                .attr("height", y.bandwidth())
                .attr('fill', d => Regcolor(d.Region))
                .attr("opacity", 0.75)
                .on("mouseover", function(d) { return tooltip.style("visibility", "visible").text(d.Expend).style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px").style("background-color", Regcolor(d.Region)), d3.select(this).attr("opacity", 1)})
                .on("mouseout", function() { return tooltip.style("visibility", "hidden"), d3.select(this).attr("opacity", 0.75)})
                                .transition()

                chart.append("text").attr("x",wid/3).attr("y", 10).attr("class","title").text("Gender LFP Gap (%)");
                chart.append("text").attr("x",wid/4+rightOffset).attr("y", 10).attr("class", "title").text("Public Expenditure by Type (% Total Exp)");
                chart.append("text").attr("x",wid+labelArea/3).attr("y", 10).attr("class", "title").text("Country");
          
        }
      }
                var dropdown = d3.select("#dropdw-container");

                dropdown.append("select")
                    .selectAll("option")
                    .data(['Social transfers/benefits', 'Economic Affairs', 'Health', 'Public order and safety', 'Defense', 'Public order and safety', 'Education', 
                      'Environment protection', 'Housing and community amenities', 'Recreation/culture'])
                    .enter()
                    .append("option")
                    .attr("value", function (d) { return d; })
                    .text(function (d) {return d;});

                 dropdown.on("change", function() {
                          d3.selectAll(".barchart").remove();
                          d3.selectAll(".left").remove();
                          d3.selectAll(".right").remove();
                          d3.selectAll(".name").remove();
                          d3.selectAll(".title").remove();
                          d3.selectAll(".text").remove();
                          d3.selectAll(".slid").remove();
                          d3.selectAll(".track").remove();
                          d3.selectAll(".slider").remove();

                    var newVar = d3.select(this).select("select").property('value');
                        newDataset   = vMap[newVar];
                    d3.json(newDataset, function(data) {
                      
                      MakeChart(data);
                        })

                });

d3.json("gov_exp_socALL.json",function(data) {
  dataset = data;
  MakeChart(dataset);
    });

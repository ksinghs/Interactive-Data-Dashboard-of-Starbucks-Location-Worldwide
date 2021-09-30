// Load all datas
var StarbucksData, Countrylist, Statedata, Barchartdata, markerClusters;

d3.queue()
    .defer(d3.csv, "data/directory.csv")
    .defer(d3.csv, "data/country_count.csv")
    .defer(d3.csv, "data/Statewise_Count.csv")
    .defer(d3.csv, "data/global.csv")
    .await(function (error, alldata, countrydata, statedata, global) {
        if (error) throw error;

        statedata.forEach(function (d) {

            // Convert numeric values to 'numbers'
            d.Franchise = +d.Franchise;
            d.Company_Owned = +d.Company_Owned;
            d.Joint_Venture = +d.Joint_Venture;
            d.Licensed = +d.Licensed;

        });

        countrydata.forEach(function (d) {

            d.Count_State = +d.Count_State;
            d.Franchise = +d.Franchise;
            d.Company_Owned = +d.Company_Owned;
            d.Joint_Venture = +d.Joint_Venture;
            d.Licensed = +d.Licensed;
            d.Total = +d.Total;
        });


        Barchartdata = global;
        StarbucksData = alldata;
        Statedata = statedata;
        Countrylist = countrydata;

        // call main program for first time
        main();

    });




/** main program */

function main() {

    // load maps and data 
    var tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }),

        latlng = L.latLng(44.35, 17.58);

    //initialize the map
    var map = L.map('map', { center: latlng, zoom: 1, layers: [tiles] });

    // Initialize marker clusters
    markerClusters = L.markerClusterGroup();

    addmarker();

    //adding layer to clusters
    map.addLayer(markerClusters);


    // Load barchart data 
    createBarChart(d3.select("#starbucks").property("value"), 0);
    infoupdate(d3.select("#starbucks").property("value"));

    var mydata = Barchartdata.filter(f => f.Total_category == d3.select("#starbucks").property("value"));
    var countries = [...new Set(mydata.map(d => d.Country))];
    var inputvalue = Statedata.filter(function (el) { return countries.includes(el.Country) });

    generateChart(inputvalue);


    var select = d3.select("#starbucks")
        .on("change", function () {

            createBarChart(this.value, 750);
            updatelegends();
            infoupdate(this.value);
            var mydata = Barchartdata.filter(f => f.Total_category == this.value);
            var countries = [...new Set(mydata.map(d => d.Country))];
            var inputvalue = Statedata.filter(function (el) { return countries.includes(el.Country) });
            generateChart(inputvalue);

        })

    var checkbox = d3.select("#sort")
        .on("click", function () {
            createBarChart(select.property("value"), 750)
        })


}


function addmarker() {
    StarbucksData.forEach(function (d) {
        var popup = '<b>Name: </b>' + d.Store_Name + '<br/><b>Address:</b> ' + d.Street_Address + '<br/><b>Phone:</b> ' + d.Phone_Number;

        var m = L.marker([+d.Latitude, +d.Longitude]).bindPopup(popup);

        markerClusters.addLayer(m);
    });
}

//**Create and update Barchart */

function createBarChart(input, speed) {

    var keys = Barchartdata.columns.slice(1);

    var country = [...new Set(Barchartdata.map(d => d.Country))]

    var svg = d3.select("#BarChart"),
        margin = { top: 35, left: 65, bottom: 0, right: 15 },
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;

    var y = d3.scaleBand().range([margin.top, height - margin.bottom])
        .padding(0.1)
        .paddingOuter(0.2)
        .paddingInner(0.2)

    var x = d3.scaleLinear().range([margin.left, width - margin.right])

    var yAxis = svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .attr("class", "y-axis")

    var xAxis = svg.append("g")
        .attr("transform", `translate(0,${margin.top})`)
        .attr("class", "x-axis")

    var z = d3.scaleOrdinal()
        .range(["steelblue", "blue", "lightblue", "green"])
        .domain(keys);


    // data from the input   
    var data = Barchartdata.filter(f => f.Total_category == input)
    console.log(input);
    console.log(Barchartdata);

    data.forEach(function (d) {
        d.total = d3.sum(keys, k => +d[k])
        return d
    })

    x.domain([0, d3.max(data, d => d.total)]).nice();

    svg.selectAll(".x-axis").transition().duration(speed)
        .call(d3.axisTop(x).ticks(null, "s"))

    data.sort(d3.select("#sort").property("checked")
        ? (a, b) => b.total - a.total
        : (a, b) => country.indexOf(a.Country) - country.indexOf(b.Country))

    y.domain(data.map(d => d.Country));

    svg.selectAll(".y-axis").transition().duration(speed)
        .call(d3.axisLeft(y).tickSizeOuter(0))

    var group = svg.selectAll("g.layer")
        .data(d3.stack().keys(keys)(data), d => d.key)

    group.exit().remove()

    group.enter().insert("g", ".y-axis").append("g")
        .classed("layer", true)
        .attr("fill", d => z(d.key));

    var bars = svg.selectAll("g.layer").selectAll("rect")
        .data(d => d, e => e.data.Country);

    bars.exit().remove()

    bars.enter().append("rect")
        .attr("height", y.bandwidth())
        .merge(bars)
        .transition().duration(speed)
        .attr("y", d => y(d.data.Country))
        .attr("x", d => x(d[0]))
        .attr("width", d => x(d[1]) - x(d[0]))

    var text = svg.selectAll(".text")
        .data(data, d => d.Country);

    text.exit().remove()

    text.enter().append("text")
        .attr("class", "text")
        .attr("text-anchor", "start")
        .merge(text)
        .transition().duration(speed)
        .attr("y", d => y(d.Country) + y.bandwidth() / 2.5)
        .attr("x", d => x(d.total) + 2)
        .text(d => d.total)

    updatelegend();

}

function infoupdate(input) {

    var Data = Barchartdata.filter(f => f.Total_category == input);

    var Svalue1 = [input];

    d3.select("#Svalue1 span").remove();

    d3.select("#Svalue1")
        .selectAll("span")
        .data(Svalue1)
        .enter()
        .append("span")
        .text(function (d) { return d; });


    var Svalue2 = [d3.sum(Data, function (d) { return d.total })];
    console.log(Svalue2);

    d3.select("#Svalue2 span").remove();

    d3.select("#Svalue2")
        .selectAll("span")
        .data(Svalue2)
        .enter()
        .append("span")
        .text(function (d) { return d; });


    var Svalue3 = [(d3.sum(Data, function (d) { return d.total }) / 25600) * 100 + "%"]

    d3.select("#Svalue3 span").remove();

    d3.select("#Svalue3")
        .selectAll("span")
        .data(Svalue3)
        .enter()
        .append("span")
        .text(function (d) { return d; });


}



//* Bubble chart //
function generateChart(data) {

    var width = 500;
    var height = 350;
    var colors = d3.scaleOrdinal(d3.schemeCategory20);

    var bubble = data => d3.pack()
        .size([width, height])
        .padding(1)(d3.hierarchy({ children: data }).sum(d => d.Total));

    var svg = d3.select('#bubble-chart')
        .style('width', width)
        .style('height', height);

    var root = bubble(data);
    var tooltip = d3.select('.tooltip');

    var node = svg.selectAll()
        .data(root.children)
        .enter().append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);

    d3.selectAll("circle").remove();

    var circle = node.append('circle')
        .style('fill', function (d, i) { return colors(i); })
        .on('mouseover', function (e, d) {
            tooltip.html("Country:" + e.data.Country + "/" + "State:" + e.data.State + "/" + "Count:" + e.data.Total);
            tooltip.style('visibility', 'visible');
        })
        .on('mousemove', e => tooltip.style('top', `${e.pageY + 10}py`)
            .style('left', `${e.pageX}px`))
        .on('mouseout', function () {
            d3.select(this).style('stroke', 'none');
            return tooltip.style('visibility', 'hidden');
        });


    node.transition()
        .ease(d3.easeExpInOut)
        .duration(1000)
        .attr('transform', d => `translate(${d.x}, ${d.y})`);

    circle.transition()
        .ease(d3.easeExpInOut)
        .duration(1000)
        .attr('r', d => d.r);


};


function updatelegend() {

    var columns = ["Licensed", "Company Owned", "Franchise", "Joint Venture"]

    var width = 200,
        height = 250,
        radius = Math.min(width, height) / 2;

    var color = d3.scaleOrdinal()
        .range(["green", "steelblue", "blue", "lightblue"]).domain(columns);
    var legend = d3.select("#legends").append("svg")
        .attr("class", "legend")
        .attr("width", radius * 1.5)
        .attr("height", radius * 1.5)
        .selectAll("g")
        .data(color.domain().slice().reverse())
        .enter().append("g")
        .attr("transform", function (d, i) { return "translate(0," + i * 20 + ")"; });


    legend.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .style("fill", color);

    legend.append("text")
        .attr("x", 18)
        .attr("y", 7)
        .attr("dy", ".35em")
        .text(function (d) { return d; });
}


// Step-1 : Load all csv and declare global variable //
var StarbucksData;
var Countrylist;
var Statedata;
var Piechartdata;

d3.queue()
  .defer(d3.csv, "data/directory.csv")
  .defer(d3.csv, "data/country_count.csv")
  .defer(d3.csv, "data/Statewise_Count2.csv")
  .defer(d3.csv, "data/pie2.csv")
  .await(function (error, alldata, countrydata, statedata, piedata) {
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


    piedata.forEach(function (d) {

      d.Count = +d.Count;

    });

    StarbucksData = alldata;
    Statedata = statedata;
    Countrylist = countrydata;
    Piechartdata = piedata;

    // call main program for first time
    main(StarbucksData);



  });


/** main Programs */

function main(csv) {

  Country = [...new Set(csv.map(d => d.Country))]

  console.log(csv);
  console.log(Country);

  var options = d3.select("#country").selectAll("option")
    .data(Country)
    .enter().append("option")
    .text(d => d)

  updatedropdownlist(d3.select("#country").property("value"));
  createBarChart(d3.select("#country").property("value"), 0);
  createDonutChart(d3.select("#country").property("value"));
  tabulate(d3.select("#country").property("value"), d3.select("#state").property("value"));
  infoupdate(d3.select("#country").property("value"));


  var select = d3.select("#country")
    .on("change", function () {
      createBarChart(this.value, 750);
      updatedropdownlist(this.value);
      tabulate(this.value, d3.select("#state").property("value"));
      infoupdate(this.value);
      createDonutChart(this.value);

    })

  var checkbox = d3.select("#sort")
    .on("click", function () {
      createBarChart(select.property("value"), 750)
    })

  var changeState = d3.select("#state")
    .on("change", function () {
      tabulate(d3.select("#country").property("value"), this.value);

    })

}



//** Fill and update Dropdownlist */

function updatedropdownlist(input) {

  console.log(input);
  Country = [...new Set(StarbucksData.map(d => d.Country))]

  console.log(Country);

  var option = d3.select("#state").selectAll("option")
    .remove()

  var data = StarbucksData.filter(f => f.Country == input)

  var state = [...new Set(data.map(d => d.State))]

  console.log(state)

  var option = d3.select("#state").selectAll("option")
    .data(state)
    .enter().append("option")
    .text(d => d)
}


//**Create and update Barchart */

function createBarChart(input, speed) {


  var keys = Statedata.columns.slice(2);

  var Country = [...new Set(Statedata.map(d => d.Country))]
  var states = [...new Set(Statedata.map(d => d.State))]

  var options = d3.select("#country").selectAll("option")
    .data(Country)
    .enter().append("option")
    .text(d => d)

  var svg = d3.select("#chart"),
    margin = { top: 35, left: 35, bottom: 0, right: 15 },
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

  var data = Statedata.filter(f => f.Country == input)

  data.forEach(function (d) {
    d.total = d3.sum(keys, k => +d[k])
    return d
  })

  x.domain([0, d3.max(data, d => d.total)]).nice();

  svg.selectAll(".x-axis").transition().duration(speed)
    .call(d3.axisTop(x).ticks(null, "s"))

  data.sort(d3.select("#sort").property("checked")
    ? (a, b) => b.total - a.total
    : (a, b) => states.indexOf(a.State) - states.indexOf(b.State))

  y.domain(data.map(d => d.State));

  svg.selectAll(".y-axis").transition().duration(speed)
    .call(d3.axisLeft(y).tickSizeOuter(0))

  var group = svg.selectAll("g.layer")
    .data(d3.stack().keys(keys)(data), d => d.key)

  group.exit().remove()

  group.enter().insert("g", ".y-axis").append("g")
    .classed("layer", true)
    .attr("fill", d => z(d.key));

  var bars = svg.selectAll("g.layer").selectAll("rect")
    .data(d => d, e => e.data.State);

  bars.exit().remove()

  bars.enter().append("rect")
    .attr("height", y.bandwidth())
    .merge(bars)
    .transition().duration(speed)
    .attr("y", d => y(d.data.State))
    .attr("x", d => x(d[0]))
    .attr("width", d => x(d[1]) - x(d[0]))

  var text = svg.selectAll(".text")
    .data(data, d => d.State);

  text.exit().remove()

  text.enter().append("text")
    .attr("class", "text")
    .attr("text-anchor", "start")
    .merge(text)
    .transition().duration(speed)
    .attr("y", d => y(d.State) + y.bandwidth() / 2)
    .attr("x", d => x(d.total) + 2)
    .text(d => d.total)

}

//** create and update donut chart */


function createDonutChart(input) {

  var data = Piechartdata.filter(f => f.Country == input)

  console.log(data);

  var columns = ["Licensed", "Company Owned", "Franchise", "Joint Venture"]

  var width = 200,
    height = 250,
    radius = Math.min(width, height) / 2;

  var color = d3.scaleOrdinal()
    .range(["green", "steelblue", "blue", "lightblue"]).domain(columns);

  var arc = d3.arc()
    .outerRadius(radius - 10)
    .innerRadius(radius - 70);

  var pie = d3.pie()
    .sort(null)
    .value(function (d) { return d.Count; });


  var svg = d3.select("#donut-chart")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  var g = svg.selectAll(".arc")
    .data(pie(data))
    .enter().append("g")
    .attr("class", "arc");

  g.append("path")
    .attr("d", arc)
    .attr("fill", function (d) { return color(d.data.Owner_Type); });


  var legend = d3.select("#legend").append("svg")
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


// ** create and update Tabular Data ** //

function tabulate(input, state) {

  var columns = ["Store_Number", "Store_Name", "Street_Address", "Phone_Number"];

  var data = StarbucksData.filter(f => f.Country == input && f.State == state);

  console.log(data);

  d3.select("#Table_Data table").remove();

  var table = d3.select("#Table_Data").append("table"),
    thead = table.append("thead"),
    tbody = table.append("tbody");

  // Append the header row
  thead.append("tr")
    .selectAll("th")
    .data(columns)
    .enter()
    .append("th")
    .text(function (column) {
      return column;
    });

  // Create a row for each object in the data
  var rows = tbody.selectAll("tr")
    .data(data)
    .enter()
    .append("tr");

  // Create a cell in each row for each column
  var cells = rows.selectAll("td")
    .data(function (row) {
      return columns.map(function (column) {
        return {
          column: column,
          value: row[column]
        };
      });
    })
    .enter()
    .append("td")
    .text(function (d) { return d.value; });

  return table;
}


function infoupdate(input) {

  var data = Countrylist.filter(f => f.Country == input)

  var statecount = [...new Set(data.map(d => d.Count_State))]

  var Total = [...new Set(data.map(d => d.Total))]

  var myData = [Total]
  var myData2 = [statecount]

  d3.select("#infodata span").remove();

  var body = d3.select("#infodata")
    .selectAll("span")
    .data(myData)
    .enter()
    .append("span")
    .text(function (d) { return d + " "; });

  d3.select("#infodata2 span").remove();

  var body = d3.select("#infodata2")
    .selectAll("span")
    .data(myData2)
    .enter()
    .append("span")
    .text(function (d) { return d + " "; });

}




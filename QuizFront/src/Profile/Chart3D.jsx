import React, { useLayoutEffect, useRef } from "react";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";

am4core.useTheme(am4themes_animated);

export default function Chart3D({ data, darkMode }) {
  const chartRef = useRef(null);

  useLayoutEffect(() => {
    let chart = am4core.create(chartRef.current, am4charts.XYChart3D);

    chart.data = data;

    // Axes
    let categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
    categoryAxis.dataFields.category = "label";
    categoryAxis.renderer.labels.template.rotation = 0;
    categoryAxis.renderer.labels.template.hideOversized = false;
    categoryAxis.renderer.labels.template.fontSize = 14;
    categoryAxis.renderer.labels.template.truncate = false;
    categoryAxis.renderer.labels.template.wrap = true;
    categoryAxis.renderer.minGridDistance = 30;
    categoryAxis.renderer.labels.template.horizontalCenter = "middle";
    categoryAxis.renderer.labels.template.verticalCenter = "bottom";


    let valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
    valueAxis.title.text = "Score";
    valueAxis.title.fontWeight = "bold";

    // Series
    let series = chart.series.push(new am4charts.ColumnSeries3D());
    series.dataFields.valueY = "value";
    series.dataFields.categoryX = "label";
    series.name = "Score";
    series.tooltipText = "[bold]{valueY}[/]";
    series.columns.template.fillOpacity = 0.8;

    let columnTemplate = series.columns.template;
    columnTemplate.strokeWidth = 2;
    columnTemplate.strokeOpacity = 1;
    columnTemplate.stroke = am4core.color("#FFFFFF");

    columnTemplate.adapter.add("fill", (fill, target) => chart.colors.getIndex(target.dataItem.index));
    columnTemplate.adapter.add("stroke", (stroke, target) => chart.colors.getIndex(target.dataItem.index));

    chart.cursor = new am4charts.XYCursor();
    chart.cursor.lineX.strokeOpacity = 0;
    chart.cursor.lineY.strokeOpacity = 0; 

    

    return () => {
      chart.dispose();
    };
  }, [data, darkMode]);

  return <div id="chartdiv" ref={chartRef} style={{ width: "100%", height: "90%" }} />;
}

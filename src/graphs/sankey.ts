import * as d3 from "d3";
import {
  sankey as d3Sankey,
  sankeyLinkHorizontal,
  SankeyLink,
  SankeyNode,
} from "d3-sankey";

interface SankeyNodeExtended extends SankeyNode<any, any> {
  nodeId: number;
  name: string;
}

interface SankeyLinkExtended extends SankeyLink<SankeyNodeExtended, any> {
  source: number | SankeyNodeExtended;
  target: number | SankeyNodeExtended;
  value: number;
}

import { defaultScheme } from "@/theme/colors";


const width = 800;
const height = 500;

export type SankeyData = {
  name: string;
  nodes: { nodeId: number, name: string }[];
  links: { source: number, target: number, value: number }[]
}

export function createSankey(
  rootDiv: HTMLElement,
  data: SankeyData[],
  color: (_a: string, _b: string) => string) {
  const svg = d3.select(rootDiv)
    .append("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("width", width * 1.5)
    .attr("height", height * 1.5)
    .attr("style", "max-width: 100%; height: auto;")
    .attr("viewBox", [0, 0, width, height])

  let graphCount = 0
  for (const graph of data) {

    const sankey = d3Sankey<SankeyNodeExtended, SankeyLinkExtended>()
      .nodeId((d) => d.nodeId)
      .nodeSort((a, b)=>a.nodeId - b.nodeId)
      .linkSort((a, b)=>(a.target as {nodeId: number}).nodeId - (b.target as {nodeId: number}).nodeId)
      .nodeWidth(4)
      .nodePadding(20)
      .extent([[0, 5 + graphCount / data.length * height], [width - 100, (graphCount + 1) / data.length * height - 5]])

    const { nodes, links } = sankey(graph);

    const maxDepth = Math.max(...nodes.map(x => x.depth!))

    svg.append("g")
      .selectAll("rect")
      .data(nodes)
      .join("rect")
      .attr("x", d => d.x0!)
      .attr("y", d => d.y0!)
      .attr("height", d => d.y1! - d.y0!)
      .attr("width", d => d.x1! - d.x0!)
      .attr("fill", defaultScheme.f_high)

    //its multiply so we need to redraw a bg behind it lol, kinda wacky!!...

    svg.append("g")
      .attr("fill", "none")
      .selectAll("g")
      .data(links)
      .join("path")
      .attr("d", sankeyLinkHorizontal())
      .attr("stroke", () => "white")
      .attr("stroke-width", d => d.width!)

    svg.append("g")
      .attr("fill", "none")
      .selectAll("g")
      .data(links)
      .join("path")
      .attr("d", sankeyLinkHorizontal())
      .attr("stroke", d => color((d.source as { name: string }).name, (d.target as { name: string }).name))
      .attr("stroke-width", d => d.width!)
      .style("mix-blend-mode", "multiply")
      .append('title')
      .text(d => `${(d.source as { name: string }).name} -> ${d.value} -> ${(d.target as { name: string }).name}`)

    //console.log(nodes)

    {
      svg.append("g")
        .selectAll("rect")
        .data(nodes)
        .join("rect")
        .filter(d => d.depth! == 0)
        .attr("x", 5)
        .attr("y", d => (d.y1! + d.y0!) / 2 - 10 - 10)
        .attr("height", "20")
        .attr("width", "110")
        .attr("rx", "2")
        .attr("fill", "white")
        .attr("opacity", 0.7)
      svg.append("g")
        .selectAll("rect")
        .data(nodes)
        .join("text")
        .filter(d => d.depth! == 0)
        .attr("x", 5)
        .attr("y", d => (d.y1! + d.y0!) / 2 + 10 + 5 - 20)
        .attr("fill", "black")
        .text(d => d.name)
    }

    {
      svg.append("g")
        .selectAll("rect")
        .data(nodes)
        .join("rect")
        .filter(d => d.depth! != 0 && d.depth! != maxDepth)
        .attr("x", d => d.x0! - 25)
        .attr("y", d => (d.y1! + d.y0!) / 2 - 10 - 10)
        .attr("height", "40")
        .attr("width", "50")
        .attr("rx", "2")
        .attr("fill", "white")
        .attr("opacity", 0.7)

      svg.append("g")
        .selectAll("rect")
        .data(nodes)
        .join("text")
        .filter(d => d.depth! != 0 && d.depth! != maxDepth)
        .attr("x", d => d.x0!)
        .attr("y", d => (d.y1! + d.y0!) / 2 + 10 + 5 - 20)
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .text(d => d.name)

      svg.append("g")
        .selectAll("rect")
        .data(nodes)
        .join("text")
        .filter(d => d.depth! != 0 && d.depth! != maxDepth)
        .attr("x", d => d.x0!)
        .attr("y", d => (d.y1! + d.y0!) / 2 + 10 + 5)
        .attr("fill", defaultScheme.b_high)
        .attr("text-anchor", "middle")
        .text(d => d.value!)
    }
    {
      svg.append("g")
        .selectAll("rect")
        .data(nodes)
        .join("text")
        .filter(d => d.depth! == maxDepth)
        .attr("x", d => d.x0! + 5 + 50)
        .attr("y", d => (d.y1! + d.y0!) / 2 + 10 + 5 - 20)
        .attr("fill", defaultScheme.f_high)
        .attr("text-anchor", "middle")
        .text(d => d.name)

      svg.append("g")
        .selectAll("rect")
        .data(nodes)
        .join("text")
        .filter(d => d.depth! == maxDepth)
        .attr("x", d => d.x0! + 5 + 50)
        .attr("y", d => (d.y1! + d.y0!) / 2 + 10 + 5)
        .attr("fill", defaultScheme.f_med)
        .attr("text-anchor", "middle")
        .text(d => d.value!)
    }
    svg.append("g")
    .append("text")
    .attr("x", 5)
    .attr("y", graphCount / data.length * height + 15)
    .attr("fill", defaultScheme.f_high)
    .text(graph.name)

    graphCount+=1
  }
}

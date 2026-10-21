import { SheetChart, type SheetChartCategory, type SheetChartMetric } from "@jordanscamp/ds";

export interface ResultsProps {
  title: string;
  categories: SheetChartCategory[];
  metrics: SheetChartMetric[];
}

export default function ResultsChart({ title, categories, metrics }: ResultsProps) {
  return <SheetChart title={title} categories={categories} metrics={metrics} />;
}

/** The same figures without the chart, for the prerendered page and before the island loads. */
export function ResultsTable({ title, categories, metrics }: ResultsProps) {
  return (
    <table>
      <caption>{title}: the questionnaire at four times its size, 1,236 questions.</caption>
      <thead>
        <tr>
          <th scope="col">State layer</th>
          {metrics.map((metric) => (
            <th key={metric.id} scope="col">
              {metric.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {categories.map((category, index) => (
          <tr key={category.id}>
            <th scope="row">{category.label}</th>
            {metrics.map((metric) => (
              <td key={metric.id}>{metric.format(metric.values[index] ?? 0)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

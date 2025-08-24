import AggregationSelector from "./aggregation-selector";
import XAxisSelector from "./x-axis-selector";

export default function LineChartConfigForm() {
  return (
    <>
      <XAxisSelector />
      <AggregationSelector />
    </>
  );
}

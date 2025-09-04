import AggregationSelector from "./aggregation-selector";
import GroupBySelector from "./group-by-selector";
import XAxisSelector from "./x-axis-selector";

export default function BarChartConfigForm() {
  return (
    <>
      <XAxisSelector />
      <AggregationSelector />
      <GroupBySelector />
    </>
  );
}

import AggregationSelector from "./aggregation-selector";
import GroupBySelector from "./group-by-selector";
import LimitInput from "./limit-input";
import SortBySelector from "./sort-by-selector";
import XAxisSelector from "./x-axis-selector";

export default function LineChartConfigForm() {
  return (
    <>
      <XAxisSelector />
      <AggregationSelector />
      <GroupBySelector />
      <SortBySelector />
      <LimitInput />
    </>
  );
}

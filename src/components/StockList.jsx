import { FixedSizeList as List } from "react-window";
import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { fetchStocksData } from "../services/stockService";
import { useInfiniteQuery } from "@tanstack/react-query";

const PAGE_SIZE = 20;

const useDebounceValue = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// added memo to render only when the data changes...
const StockRow = memo(({ index, style, data, width }) => {
  const stock = data[index];
  const customStyles = {
    borderRadius: "8px",
    border: "1px solid #ddd",
    backgroundColor: index % 2 === 0 ? "#121212" : "#343A40",
    padding: "10px",
    margin: "5px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#FFFFF0",
    width: width,
  };
  return (
    <div style={{ ...style, ...customStyles }}>
      <p style={{ flex: 1, paddingLeft: "10px" }}>{stock.name}</p>
      <p style={{ flex: 1, textAlign: "right", paddingRight: "10px" }}>
        {stock.symbol}
      </p>
    </div>
  );
});

const StockList = () => {
  // state to set the search query...
  const [query, setQuery] = useState("");

  // use debounced value...
  const debouncedQuery = useDebounceValue(query, 300);

  // to optimize the re-renders while searching...
  const deferredQuery = useDeferredValue(debouncedQuery);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["stocks"],
    queryFn: ({ pageParam = 1 }) => fetchStocksData(pageParam, PAGE_SIZE),
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.flatMap((page) => page.stocks).length;
      return totalFetched < lastPage.totalCount && lastPage.stocks.length > 0
        ? allPages.length + 1
        : undefined;
    },
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  // convert the pages into single array...
  const stocks = data?.pages.flatMap((page) => page.stocks) || [];

  // filtering stocks when stocks or query changes...
  const filteredStocks = useMemo(() => {
    if (!stocks || stocks.length === 0) return [];
    // No search input - return the original stocks data...
    if (!deferredQuery.trim()) return stocks;

    return stocks.filter(
      (stock) =>
        stock.name.toLowerCase().includes(deferredQuery.toLowerCase()) ||
        stock.symbol.toLowerCase().includes(deferredQuery.toLowerCase())
    );
  }, [stocks, deferredQuery]);

  // handle the scroll event...
  const handleScroll = useCallback(
    ({ visibleStopIndex }) => {
      if (
        visibleStopIndex >= filteredStocks.length - 1 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage, filteredStocks.length]
  );

  if (isLoading) return <h2>Loading stocks....</h2>;
  if (isError) return <h2>Error fetching stocks...</h2>;

  return (
    <>
      <input
        type="text"
        placeholder="Search Stocks..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "10px",
          fontSize: "16px",
        }}
      />
      {filteredStocks.length === 0 ? (
        <p>No Stocks Found..</p>
      ) : (
        <>
          <table
            style={{ border: "1", borderCollapse: "collapse", width: "100%" }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: "#222",
                  color: "white",
                  textAlign: "left",
                }}
              >
                <th style={{ width: "50%", padding: "10px" }}>Name</th>
                <th
                  style={{ width: "50%", padding: "10px", textAlign: "right" }}
                >
                  Symbol
                </th>
              </tr>
            </thead>
          </table>
          <List
            height={600}
            itemCount={filteredStocks.length}
            itemSize={55}
            onItemsRendered={({ visibleStopIndex }) =>
              handleScroll({ visibleStopIndex })
            }
            width={"100%"}
          >
            {({ index, style }) => (
              <StockRow
                index={index}
                style={style}
                data={filteredStocks}
                width={"100%"}
              />
            )}
          </List>
          {isFetchingNextPage && "Loading Stocks..."}
        </>
      )}
    </>
  );
};

export default StockList;

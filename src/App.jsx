import { lazy } from "react";
import "./App.css";
import { Suspense } from "react";
const StockList = lazy(() => import("./components/StockList"));

function App() {
  return (
    <>
      <h1 className="text-xl bg-blue-500 font-bold text-blue-500">
        Stock Market Index
      </h1>
      <Suspense fallback={<h2>Fetching Stocks..</h2>}>
        <StockList />
      </Suspense>
    </>
  );
}

export default App;

import React, { useEffect } from "react"
import ReactDOM from "react-dom/client"
import { Provider } from "react-redux"
import { store } from "./app/store"
import 'bootstrap/dist/css/bootstrap.min.css';
import { createHashRouter, RouterProvider, useNavigate, } from "react-router-dom";
import { Header } from "./component/Header"
import { Accounts } from "./component/Accounts"
import { Transactions } from "./component/Transactions";
import { Graphs } from "./component/Graphs";

const router = createHashRouter([
  {
    path: "/",
    element: <Header />,
    children: [
      {
        path: "/",
        element: <Redirector />
      },
      {
        path: "/accounts",
        element: <Accounts />
      },
      {
        path: "/accounts/:accountId/transactions",
        element: <Transactions />
      },
      {
        path: "/graphs",
        element: <Graphs />
      }
    ]
  },
]);

function Redirector() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/accounts")
  }, []);

  return (<React.Fragment/>)
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>,
)

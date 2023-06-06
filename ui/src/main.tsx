import React from "react"
import ReactDOM from "react-dom/client"
import { Provider } from "react-redux"
import { store } from "./app/store"
import 'bootstrap/dist/css/bootstrap.min.css';
import { createBrowserRouter, RouterProvider, } from "react-router-dom";
import { Header } from "./component/Header"
import { Accounts } from "./component/Accounts"
import { Transactions } from "./component/Transactions";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Header />,
    children: [
      {
        path: "/home",
        element: <div>Home</div>
      },
      {
        path: "/accounts",
        element: <Accounts />
      },
      {
        path: "/accounts/:accountId/transactions",
        element: <Transactions />
      }
    ]
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>,
)

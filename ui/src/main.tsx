import React, { useEffect } from "react"
import ReactDOM from "react-dom/client"
import { Provider } from "react-redux"
import { store } from "./app/store"
import "bootstrap/dist/css/bootstrap.min.css"
import "./style.css"
import { createHashRouter, RouterProvider, useNavigate } from "react-router-dom"
import { Header } from "./component/Header"
import { Accounts } from "./component/Accounts"
import { Transactions } from "./component/Transactions"
import { Statistics } from "./component/Statistics"
import { Settings } from "./component/Settings"
import { Issues } from "./component/Issues"
import { Expenses } from "./component/Expenses"

const router = createHashRouter([
  {
    path: "/",
    element: <Header />,
    children: [
      {
        path: "/",
        element: <Redirector />,
      },
      {
        path: "/accounts",
        element: <Accounts />,
      },
      {
        path: "/transactions",
        element: <AllTransactions />,
      },
      {
        path: "/accounts/:accountId/transactions",
        element: <SpecificTransactions />,
      },
      {
        path: "/expenses",
        element: <Expenses />,
      },
      {
        path: "/issues",
        element: <Issues />,
      },
      {
        path: "/statistics",
        element: <Statistics />,
      },
      {
        path: "/settings",
        element: <Settings />,
      },
    ],
  },
])

// Exists to prevent react router from reusing the Transaction component
function AllTransactions() {
  return <Transactions />
}

// Exists to prevent react router from reusing the Transaction component
function SpecificTransactions() {
  return <Transactions />
}

function Redirector() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate("/accounts")
  }, [])

  return <React.Fragment />
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>,
)

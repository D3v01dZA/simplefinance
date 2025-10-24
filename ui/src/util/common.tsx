import React, { CSSProperties } from "react"
import { accountTitle } from "./util"
import { IndexedAccounts } from "../app/accountSlice"

export function AccountName({
  accountId: accountId,
  accounts,
}: {
  accountId: string
  accounts: IndexedAccounts
}) {
  return <React.Fragment>{accountTitle(accountId, accounts)}</React.Fragment>
}

export function cellStyle(width: string): CSSProperties {
  return {
    width: width,
    maxWidth: width,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }
}

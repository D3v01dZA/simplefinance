import { useAppDispatch, useAppSelector } from "../app/hooks";
import { addAccount, selectAccounts } from "./accountSlice";

export function Accounts() {
    const accounts = useAppSelector(selectAccounts);
    const dispatch = useAppDispatch();

    return <div><button aria-label="Increment value" onClick={() => dispatch(addAccount({id: "1", name: "One"}))}>Add</button>{accounts.map(account => account.id)}</div>
}
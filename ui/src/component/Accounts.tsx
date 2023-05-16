import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { selectServer } from "../app/serverSlice";
import { get, err } from "../util/util";
import { Account, addAccount, selectAccounts, setAccounts } from "./accountSlice";

export function Accounts() {
    const server = useAppSelector(selectServer);
    const accounts = useAppSelector(selectAccounts);
    const dispatch = useAppDispatch();

    useEffect(() => {
        get<Account[]>(server, "/api/account/")
            .then(accounts => dispatch(setAccounts(accounts)))
            .catch(error => err(error));
    }, []);

    return (
        <div>
            <button aria-label="Increment value" onClick={() => dispatch(addAccount({id: "1", name: "One"}))}>
                Add
            </button>
            {accounts.map(account => account.id)}
        </div>
    )
}
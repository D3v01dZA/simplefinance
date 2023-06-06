import { useEffect, useState } from "react";
import { useAppSelector } from "../app/hooks";
import { selectServer } from "../app/serverSlice";
import { err, get, titleCase } from "../util/util";
import { Container, Form, Row } from "react-bootstrap";
import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";

interface JRawBalances {
    localDate: string,
    cashBalance: number,
    liquidAssetsBalance: number,
    illiquidAssetsBalance: number,
    retirementBalance: number,
    liabilitiesBalance: number,
    net: number
}

interface JBalance extends JRawBalances {
    localDate: string,
    difference: JRawBalances,
}

interface Data {
    date: string,
    cashBalance: number,
    liquidAssetsBalance: number,
    illiquidAssetsBalance: number,
    retirementBalance: number,
    liabilitiesBalance: number,
    net: number,
}

enum DateType {
    MONTHLY = "MONTHLY",
    WEEKLY = "WEEKLY",
}

enum DataType {
    NET = "NET",
    DIFFERENCE = "DIFFERENCE",
}

function url(dateType: DateType) {
    switch (dateType) {
        case DateType.MONTHLY:
            return "/api/monthly/";
        case DateType.WEEKLY:
            return "/api/weekly/";
    }
}

function calculateData(dataType: DataType, balance: JBalance): Data {
    switch (dataType) {
        case DataType.NET:
            return {
                ...balance,
                date: balance.localDate.substring(5, balance.localDate.length)
            }
        case DataType.DIFFERENCE:
            return {
                ...balance.difference,
                date: balance.localDate.substring(5, balance.localDate.length)
            }
    }
}

export function Graphs() {
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

    const server = useAppSelector(selectServer);

    const [dateType, setDateType] = useState(DateType.WEEKLY);
    const [dataType, setDataType] = useState(DataType.DIFFERENCE);

    const [data, setData] = useState<Data[]>([]);
    const [balances, setBalances] = useState<JBalance[]>([]);

    useEffect(() => {
        get<JBalance[]>(server, url(dateType))
            .then(balances => setBalances(balances))
            .catch(error => err(error));
    }, [dateType]);

    useEffect(() => {
        const data = balances.map(balance => calculateData(dataType, balance));
        setData(data);
    }, [balances, dataType])

    return (
        <Container>
            <Row xs={1} md={2} xl={2}>
                <Form.Group>
                    <Form.Label>Date Type</Form.Label>
                    <Form.Select value={dateType} onChange={e => setDateType(e.target.value as DateType)}>
                        {Object.keys(DateType).map(type => <option key={type} value={type}>{titleCase(type)}</option>)}
                    </Form.Select>
                </Form.Group>
                <Form.Group>
                    <Form.Label>Data Type</Form.Label>
                    <Form.Select value={dataType} onChange={e => setDataType(e.target.value as DataType)}>
                        {Object.keys(DataType).map(type => <option key={type} value={type}>{titleCase(type)}</option>)}
                    </Form.Select>
                </Form.Group>
            </Row>
            <Row xl={1} className="justify-content-center">
                <LineChart width={vw / 2} height={vh / 2} data={data}>
                    <Line type="monotone" dataKey="net" stroke="#ffbe0b" name="Net" />
                    <Line type="monotone" dataKey="cashBalance" stroke="#fb5607" name="Cash" />
                    <Line type="monotone" dataKey="liquidAssetsBalance" stroke="#ff006e" name="Liquid Assets" />
                    <Line type="monotone" dataKey="illiquidAssetsBalance" stroke="#8338ec" name="Illiquid Assets" />
                    <Line type="monotone" dataKey="retirementBalance" stroke="#3a86ff" name="Retirement" />
                    <Line type="monotone" dataKey="liabilitiesBalance" stroke="#000814" name="Liabilities" />
                    <CartesianGrid stroke="#ccc" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Legend />
                    <Tooltip />
                </LineChart>
            </Row>
        </Container>
    )
}
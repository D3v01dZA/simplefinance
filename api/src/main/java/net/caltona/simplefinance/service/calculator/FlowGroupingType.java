package net.caltona.simplefinance.service.calculator;

import net.caltona.simplefinance.api.model.JBalance;

import java.math.BigDecimal;

public enum FlowGroupingType {
    EXTERNAL,
    CASH,
    GAIN,
    APPRECIATION,
    INTEREST;

    public void addFlowGrouping(Totals totals, BigDecimal value) {
        JBalance.FlowGrouping flowGrouping = totals.getFlowGroupings().get(this);
        totals.getFlowGroupings().put(this, new JBalance.FlowGrouping(this, flowGrouping.getValue().add(value)));
    }
}

package net.caltona.simplefinance.service.calculator;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import net.caltona.simplefinance.api.model.JBalance;

import java.math.BigDecimal;
import java.util.*;

@Getter
@Setter
@AllArgsConstructor
public class Totals {

    private BigDecimal net;
    private LinkedHashMap<TotalType, JBalance.TotalBalance> totalBalances;
    private LinkedHashMap<String, JBalance.AccountBalance> accountBalances;
    private LinkedHashMap<FlowGroupingType, JBalance.FlowGrouping> flowGroupings;

    public Totals() {
        this(BigDecimal.ZERO, new LinkedHashMap<>(), new LinkedHashMap<>(), new LinkedHashMap<>());
        for (TotalType value : TotalType.values()) {
            totalBalances.put(value, new JBalance.TotalBalance(value, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO));
        }
        for (FlowGroupingType value : FlowGroupingType.values()) {
            flowGroupings.put(value, new JBalance.FlowGrouping(value, BigDecimal.ZERO));
        }
    }

}

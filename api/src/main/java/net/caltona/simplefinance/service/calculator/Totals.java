package net.caltona.simplefinance.service.calculator;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.With;
import net.caltona.simplefinance.api.model.JBalance;
import org.springframework.util.Assert;

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
            if (value != TotalType.IGNORED) {
                totalBalances.put(value, new JBalance.TotalBalance(value, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO));
            }
        }
        for (FlowGroupingType value : FlowGroupingType.values()) {
            if (value != FlowGroupingType.IGNORED) {
                flowGroupings.put(value, new JBalance.FlowGrouping(value, BigDecimal.ZERO));
            }
        }
    }

}

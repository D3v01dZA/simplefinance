package net.caltona.simplefinance.service.calculator;

import lombok.AllArgsConstructor;
import net.caltona.simplefinance.service.transaction.Transaction;

import java.math.BigDecimal;
import java.util.List;

@AllArgsConstructor
public class PlaceholderBalanceCalculator {

    private List<Transaction> transactions;

    public BigDecimal balance() {
        return BigDecimal.ZERO;
    }

}

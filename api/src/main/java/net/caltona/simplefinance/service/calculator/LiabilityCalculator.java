package net.caltona.simplefinance.service.calculator;

import lombok.AllArgsConstructor;
import net.caltona.simplefinance.service.transaction.Transaction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@AllArgsConstructor
public class LiabilityCalculator {

    private List<Transaction> transactions;

    public BigDecimal balance(LocalDate date) {
        BigDecimal value = BigDecimal.ZERO;
        for (Transaction transaction : transactions) {
            if (transaction.date().isAfter(date)) {
                return value;
            }
            value = transaction.balance(value);
        }
        return value;
    }

    public BigDecimal transfer(LocalDate date) {
        BigDecimal value = BigDecimal.ZERO;
        for (Transaction transaction : transactions) {
            if (transaction.date().isAfter(date)) {
                return value;
            }
            value = transaction.transferReverse(value);
        }
        return value;
    }

}

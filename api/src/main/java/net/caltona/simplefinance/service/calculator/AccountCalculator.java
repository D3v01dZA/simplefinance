package net.caltona.simplefinance.service.calculator;

import lombok.AllArgsConstructor;
import net.caltona.simplefinance.service.transaction.Transaction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@AllArgsConstructor
public class AccountCalculator {

    private List<Transaction> transactions;

    private boolean isNegative;

    public BigDecimal balance(LocalDate date) {
        BigDecimal value = BigDecimal.ZERO;
        for (Transaction transaction : transactions) {
            if (transaction.date().isAfter(date)) {
                if (isNegative) {
                    return value.negate();
                }
                return value;
            }
            value = transaction.balance(value);
        }
        if (isNegative) {
            return value.negate();
        }
        return value;
    }

    public BigDecimal transfer(LocalDate date) {
        BigDecimal value = BigDecimal.ZERO;
        for (Transaction transaction : transactions) {
            if (transaction.date().isAfter(date)) {
                if (isNegative) {
                    return value.negate();
                }
                return value;
            }
            value = transaction.transfer(value);
        }
        if (isNegative) {
            return value.negate();
        }
        return value;
    }

}

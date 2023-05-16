package net.caltona.simplefinance.service.transaction;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NonNull;

import java.math.BigDecimal;
import java.time.LocalDate;

@EqualsAndHashCode
@AllArgsConstructor
public class Subtraction implements Transaction {

    @NonNull
    private LocalDate date;

    @NonNull
    private BigDecimal value;

    @Override
    public LocalDate date() {
        return date;
    }

    @Override
    public BigDecimal balance(BigDecimal value) {
        return value;
    }
}

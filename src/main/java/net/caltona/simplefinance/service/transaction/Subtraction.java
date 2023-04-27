package net.caltona.simplefinance.service.transaction;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NonNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@EqualsAndHashCode
@AllArgsConstructor
public class Subtraction implements Transaction {

    @NonNull
    private LocalDateTime date;

    @NonNull
    private BigDecimal value;

    @Override
    public LocalDateTime date() {
        return date;
    }

    @Override
    public BigDecimal balance(BigDecimal value) {
        return value;
    }
}

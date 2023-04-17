package net.caltona.simplefinance.service.transaction;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NonNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@EqualsAndHashCode
@AllArgsConstructor
public class TransferOut implements Transaction {

    @NonNull
    private LocalDateTime date;

    @NonNull
    private BigDecimal value;

    @Override
    public LocalDateTime date() {
        return date;
    }

    @Override
    public BigDecimal apply(BigDecimal value) {
        return value.subtract(this.value);
    }
}

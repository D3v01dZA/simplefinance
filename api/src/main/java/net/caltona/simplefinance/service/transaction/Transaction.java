package net.caltona.simplefinance.service.transaction;

import net.caltona.simplefinance.db.model.DTransaction.Type;
import net.caltona.simplefinance.service.Validation;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface Transaction {

    Type type();

    LocalDate date();

    BigDecimal balance(BigDecimal value);

    BigDecimal transfer(BigDecimal value);

    Validation canAddTo(List<Transaction> transactions);

}

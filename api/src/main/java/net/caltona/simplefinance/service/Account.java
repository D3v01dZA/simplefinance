package net.caltona.simplefinance.service;

import net.caltona.simplefinance.db.model.DAccountConfig;
import net.caltona.simplefinance.service.calculator.Calculator.TotalType;
import net.caltona.simplefinance.service.transaction.Transaction;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface Account {

    String getId();

    String getName();

    TotalType totalType();

    BigDecimal calculateBalance(LocalDate date);

    BigDecimal calculateTransfer(LocalDate date);

    boolean canUpdateConfig(DAccountConfig updateAccountConfig);

    boolean canAddConfig(DAccountConfig newAccountConfig);

    Validation canAddTransaction(Transaction transaction);

}

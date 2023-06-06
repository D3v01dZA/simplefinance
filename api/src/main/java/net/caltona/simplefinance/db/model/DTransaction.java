package net.caltona.simplefinance.db.model;

import jakarta.persistence.*;
import lombok.*;
import net.caltona.simplefinance.api.model.JTransaction;
import net.caltona.simplefinance.service.transaction.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

@Getter
@Setter
@EqualsAndHashCode
@NoArgsConstructor

@Entity(name = "account_transaction")
public class DTransaction {

    @Id
    @Column
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column
    private String description;

    @Column
    private String date;

    @Column
    private BigDecimal value;

    @Column
    private Type type;

    @ManyToOne(optional = false)
    @JoinColumn(name = "account_id")
    private DAccount dAccount;

    @ManyToOne
    @JoinColumn(name = "to_account_id")
    private DAccount dToAccount;

    public DTransaction(String description, LocalDate date, BigDecimal value, Type type, DAccount dAccount, DAccount dToAccount) {
        this.description = description;
        this.date = date.toString();
        this.value = value;
        this.type = type;
        this.dAccount = dAccount;
        this.dToAccount = dToAccount;
    }

    public boolean isValid() {
        return type.isValid(this);
    }

    public LocalDate date() {
        return LocalDate.parse(date);
    }

    public void date(LocalDate date) {
        this.date = date.toString();
    }

    public JTransaction json() {
        return new JTransaction(id, description, date(), value, type, getDAccount().getId(), getDToAccount().map(DAccount::getId).orElse(null));
    }

    public Transaction transaction(String accountId) {
        return type.transaction(accountId, this);
    }

    public Optional<DAccount> getDToAccount() {
        return Optional.ofNullable(dToAccount);
    }

    public enum Type {
        BALANCE{
            @Override
            public boolean isValid(DTransaction dTransaction) {
                return dTransaction.getDToAccount().isEmpty();
            }

            @Override
            public Transaction transaction(String accountId, DTransaction dTransaction) {
                return new Balance(dTransaction.date(), dTransaction.getValue());
            }
        },
        ADDITION{
            @Override
            public boolean isValid(DTransaction dTransaction) {
                return dTransaction.getDToAccount().isEmpty();
            }

            @Override
            public Transaction transaction(String accountId, DTransaction dTransaction) {
                return new Addition(dTransaction.date(), dTransaction.getValue());
            }
        },
        SUBTRACTION{
            @Override
            public boolean isValid(DTransaction dTransaction) {
                return dTransaction.getDToAccount().isEmpty();
            }

            @Override
            public Transaction transaction(String accountId, DTransaction dTransaction) {
                return new Subtraction(dTransaction.date(), dTransaction.getValue());
            }
        },
        TRANSFER{
            @Override
            public boolean isValid(DTransaction dTransaction) {
                return dTransaction.getDToAccount().isPresent();
            }

            @Override
            public Transaction transaction(String accountId, DTransaction dTransaction) {
                if (dTransaction.getDAccount().getId().equals(accountId)) {
                    return new TransferOut(dTransaction.date(), dTransaction.getValue());
                } else if (dTransaction.getDToAccount().orElseThrow().getId().equals(accountId)) {
                    return new TransferIn(dTransaction.date(), dTransaction.getValue());
                }
                throw new IllegalStateException("Could not find account");
            }
        };

        public abstract boolean isValid(DTransaction dTransaction);

        public abstract Transaction transaction(String accountId, DTransaction dTransaction);
    }

    @Getter
    @EqualsAndHashCode
    @AllArgsConstructor
    public static class NewTransaction {

        @NonNull
        private String description;

        @NonNull
        private LocalDate date;

        @NonNull
        private BigDecimal value;

        @NonNull
        private DTransaction.Type type;

        @NonNull
        private String accountId;

        private String fromAccountId;

        public Optional<String> getFromAccountId() {
            return Optional.ofNullable(fromAccountId);
        }

        public DTransaction dTransaction(DAccount account, DAccount toAccount) {
            return new DTransaction(description, date, value, type, account, toAccount);
        }
    }

    @Getter
    @EqualsAndHashCode
    @AllArgsConstructor
    public static class UpdateTransaction {

        @NonNull
        private String accountId;

        @NonNull
        private String id;

        private String description;

        private LocalDate date;

        private BigDecimal value;

        public Optional<String> getDescription() {
            return Optional.ofNullable(description);
        }

        public Optional<LocalDate> getDate() {
            return Optional.ofNullable(date);
        }

        public Optional<BigDecimal> getValue() {
            return Optional.ofNullable(value);
        }
    }

}

package net.caltona.simplefinance.model;

import jakarta.persistence.*;
import lombok.*;
import net.caltona.simplefinance.api.JTransaction;
import net.caltona.simplefinance.service.Transaction;

import java.math.BigDecimal;
import java.time.Instant;
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

    public DTransaction(String description, Instant date, BigDecimal value, Type type, DAccount dAccount, DAccount dToAccount) {
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

    public JTransaction json() {
        return new JTransaction(id, description, Instant.parse(date), value, type, getDAccount().getId(), getDToAccount().map(DAccount::getId).orElse(null));
    }

    public Transaction transaction() {
        return null;
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
        },
        ADDITION{
            @Override
            public boolean isValid(DTransaction dTransaction) {
                return dTransaction.getDToAccount().isEmpty();
            }
        },
        SUBTRACTION{
            @Override
            public boolean isValid(DTransaction dTransaction) {
                return dTransaction.getDToAccount().isEmpty();
            }
        },
        TRANSFER{
            @Override
            public boolean isValid(DTransaction dTransaction) {
                return dTransaction.getDToAccount().isPresent();
            }
        };

        public abstract boolean isValid(DTransaction dTransaction);
    }

    @Getter
    @EqualsAndHashCode
    @AllArgsConstructor
    public static class NewTransaction {

        @NonNull
        private String description;

        @NonNull
        private Instant date;

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

        private Instant date;

        private BigDecimal value;

        public Optional<String> getDescription() {
            return Optional.ofNullable(description);
        }

        public Optional<Instant> getDate() {
            return Optional.ofNullable(date);
        }

        public Optional<BigDecimal> getValue() {
            return Optional.ofNullable(value);
        }
    }

}

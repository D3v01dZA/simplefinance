package net.caltona.simplefinance.model;

import jakarta.persistence.*;
import lombok.*;
import net.caltona.simplefinance.api.JAccountConfig;

import java.math.BigDecimal;
import java.util.Optional;

@Getter
@Setter
@EqualsAndHashCode
@NoArgsConstructor

@Entity(name = "account_config")
public class DAccountConfig {

    @Id
    @Column
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column
    private String name;

    @Column
    private Type type;

    @Column
    private String value;

    @ManyToOne
    @JoinColumn(name = "account_id")
    private DAccount dAccount;

    private DAccountConfig(String name, Type type, String value) {
        this.name = name;
        this.type = type;
        this.value = value;
    }

    public enum Type {
        BIG_DECIMAL{
            @Override
            Object value(String value) {
                return new BigDecimal(value);
            }

            @Override
            boolean valid(String value) {
                try {
                    new BigDecimal(value);
                    return true;
                } catch (Exception ex) {
                    return false;
                }
            }
        };

        abstract Object value(String value);

        abstract boolean valid(String value);
    }

    public Object value() {
        return type.value(value);
    }

    public boolean valid() {
        return type.valid(value);
    }

    public JAccountConfig json() {
        return new JAccountConfig(dAccount.getId(), id, name, type, value);
    }

    @Getter
    @ToString
    @EqualsAndHashCode
    @AllArgsConstructor
    public static class NewAccountConfig {

        @NonNull
        private final String accountId;

        @NonNull
        private final String name;

        @NonNull
        private final Type type;

        @NonNull
        private final String value;

        public DAccountConfig dAccountConfig() {
            return new DAccountConfig(name, type, value);
        }

    }

    @Getter
    @ToString
    @EqualsAndHashCode
    @AllArgsConstructor
    public static class UpdateAccountConfig {

        @NonNull
        private final String accountId;

        @NonNull
        private final String id;

        private final String value;

        public Optional<String> getValue() {
            return Optional.ofNullable(value);
        }

    }


}

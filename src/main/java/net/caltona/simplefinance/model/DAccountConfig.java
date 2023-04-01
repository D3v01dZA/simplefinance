package net.caltona.simplefinance.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Cascade;
import org.hibernate.annotations.CascadeType;

import java.math.BigDecimal;

@Getter
@Setter(AccessLevel.PRIVATE)
@ToString
@EqualsAndHashCode
@NoArgsConstructor

@Entity(name = "account_config")
public class DAccountConfig {

    @Id
    @Column
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column
    private Type type;

    @Column
    private String value;

    @ManyToOne(fetch = FetchType.EAGER)
    @Cascade(CascadeType.ALL)
    @JoinColumn(name = "account_id")
    private DAccount dAccount;

    public enum Type {
        TOTAL{
            @Override
            Object value(String value) {
                return new BigDecimal(value);
            }
        };

        abstract Object value(String value);
    }

    public Object value() {
        return type.value(value);
    }


}

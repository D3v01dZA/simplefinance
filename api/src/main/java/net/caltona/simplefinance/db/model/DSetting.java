package net.caltona.simplefinance.db.model;

import jakarta.persistence.*;
import lombok.*;
import net.caltona.simplefinance.api.model.JSetting;

@Getter
@Setter
@EqualsAndHashCode
@NoArgsConstructor

@Entity(name = "setting")
public class DSetting {

    @Id
    @Column
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column
    private String key;

    @Column
    private String value;

    public DSetting(String key, String value) {
        this.key = key;
        this.value = value;
    }

    public JSetting json() {
        return new JSetting(id, key, value);
    }

    @Getter
    @EqualsAndHashCode
    @AllArgsConstructor
    public static class NewSetting {

        @NonNull
        private String key;

        @NonNull
        private String value;

        public DSetting dSetting() {
            return new DSetting(key, value);
        }

    }

    @Getter
    @EqualsAndHashCode
    @AllArgsConstructor
    public static class UpdateSetting {

        @NonNull
        private String id;

        @NonNull
        private String key;

        @NonNull
        private String value;

    }
}

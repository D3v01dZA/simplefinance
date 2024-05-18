package net.caltona.simplefinance.db;

import net.caltona.simplefinance.db.model.DSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DSettingDAO extends JpaRepository<DSetting, String> {

    Optional<DSetting> findByKey(DSetting.Key key);

}

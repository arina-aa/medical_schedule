import React, { useState, useEffect } from "react";
import styles from "./index.module.css";
import Select from "react-select";

const doctorsAll = [
  "Иван Иванов",
  "Петр Петров",
  "Максим Сидоров",
  "Анастасия Смирнова",
  "Надежда Кузнецова",
  "Сергей Михайлов",
  "Ольга Федорова",
  "Евгений Орлов",
];

const doctorOptions = doctorsAll.map((doc) => ({ value: doc, label: doc }));

const startHour = 9;
const endHour = 21;

function generateTimeSlots() {
  const slots = [];
  for (let hour = startHour; hour < endHour; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`);
  }
  slots.push(`${endHour}:00`);
  return slots;
}

const timeSlots = generateTimeSlots();

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

    function isValidTimeRange(start, end) {
    const min = timeToMinutes("09:00");
    const max = timeToMinutes("21:00");
    const startMin = timeToMinutes(start);
    const endMin = timeToMinutes(end);
    return startMin >= min && endMin <= max && startMin <= endMin;
    }


function Schedule() {
    const [busySlots, setBusySlots] = useState(() => {
        const stored = localStorage.getItem("busySlots");
        return stored ? JSON.parse(stored) : {
            "0-2": "Анна",
            "0-3": "Евгений",
            "2-7": "Арина",
            "5-6": "Александр",
        };
    });

    useEffect(() => {
    localStorage.setItem("busySlots", JSON.stringify(busySlots));
    }, [busySlots]);


  const [filterDoctorText, setFilterDoctorText] = useState("");
  const [filterStart, setFilterStart] = useState("09:00");
  const [filterEnd, setFilterEnd] = useState("21:00");

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [patientName, setPatientName] = useState("");


  // Фильтруем врачей
    const filteredDoctors = filterDoctorText
    ? doctorsAll.filter((doc) => {
        const [firstName, lastName] = doc.toLowerCase().split(" ");
        const filter = filterDoctorText.toLowerCase();
        return firstName.startsWith(filter) || lastName.startsWith(filter);
        })
    : doctorsAll;

  // Фильтруем временные слоты по выбранному интервалу
  const filteredTimeSlots = timeSlots.filter((time) => {
    const tMinutes = timeToMinutes(time);
    return (
      tMinutes >= timeToMinutes(filterStart) && tMinutes <= timeToMinutes(filterEnd)
    );
  });

  function confirmSlotAction() {
    const key = `${selectedSlot.dIndex}-${selectedSlot.originalTIndex}`;
    setBusySlots((prev) => {
      const updated = { ...prev };
      if (modalMode === "add") {
        updated[key] = patientName || "Неизвестно";
      } else if (modalMode === "remove") {
        delete updated[key];
      }
      return updated;
    });
    setModalVisible(false);
  }

  return (
    <div className={styles.container}>
        <div className={styles.header}>
        <img src="/logo.png" alt="Логотип" className={styles.logo} />
        <h2 className={styles.title}>Расписание на 10 июня</h2>
        </div>

      <div className={styles.filters}>
        <label>
          Фильтр врачей:{" "}
          <input
            type="text"
            value={filterDoctorText}
            onChange={(e) => setFilterDoctorText(e.target.value)}
            placeholder="Введите имя врача"
            className={styles.filtersInput}
          />
        </label>

        <label>
        Время с:{" "}
        <input
            type="time"
            min="09:00"
            max="21:00"
            step="3600"
            value={filterStart}
            onChange={(e) => setFilterStart(e.target.value)}
        />
        </label>

        <label>
        По:{" "}
        <input
            type="time"
            min="09:00"
            max="21:00"
            step="3600"
            value={filterEnd}
            onChange={(e) => setFilterEnd(e.target.value)}
        />
        </label>
      </div>

        {!isValidTimeRange(filterStart, filterEnd) ? (
        <div
            className={styles.invalidTimeMessage}
            style={{ gridColumn: `1 / -1`, textAlign: "center", padding: "1rem" }}
        >
            Выберите корректное время
        </div>
        ) : (

      <div
        className={styles.scheduleGrid}
        style={{ gridTemplateColumns: `200px repeat(${filteredTimeSlots.length}, 1fr)` }}
      >
        <div className={styles.headerCell}>Врач / Время</div>

        {filteredTimeSlots.map((time) => (
          <div key={time} className={styles.timeCell}>
            {time}
          </div>
        ))}

        {filteredDoctors.length === 0 ? (
          <div
            className={styles.noDoctors}
            style={{ gridColumn: `1 / span ${filteredTimeSlots.length + 1}` }}
          >
            Врачи не найдены
          </div>
        ) : (
          filteredDoctors.map((doctor) => {
            const dIndex = doctorsAll.indexOf(doctor);
            return (
              <React.Fragment key={doctor}>
                <div className={styles.doctorName}>{doctor}</div>

                {filteredTimeSlots.map((time) => {
                  const originalTIndex = timeSlots.indexOf(time);
                  const key = `${dIndex}-${originalTIndex}`;
                  const isBusy = !!busySlots[key];

                  return (
                    <div
                      key={originalTIndex}
                      onClick={() => {
                        setSelectedSlot({ dIndex, originalTIndex });
                        setModalMode(isBusy ? "remove" : "add");
                        setPatientName("");
                        setModalVisible(true);
                      }}
                      className={`${styles.timeSlot} ${isBusy ? styles.busy : ""}`}
                      title={isBusy ? `Пациент: ${busySlots[key]}` : "Свободно"}
                    >
                      {isBusy && <span className={styles.slotText}>{busySlots[key]}</span>}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })
        )}
      </div>
    )}
        {modalVisible && (
        <div className={styles.modalOverlay}>
            <div
            className={styles.modal}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                confirmSlotAction();
                }
            }}
            tabIndex={0} 
            >
            {modalMode === "add" ? (
                <>
                <h3>Запись пациента</h3>
                <input
                    type="text"
                    placeholder="Имя пациента"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    autoFocus
                />
                <div className={styles.modalButtons}>
                    <button onClick={confirmSlotAction}>Подтвердить</button>
                    <button onClick={() => setModalVisible(false)}>Отмена</button>
                </div>
                </>
            ) : (
                <>
                <h3>Удалить запись?</h3>
                <div className={styles.modalButtons}>
                    <button onClick={confirmSlotAction}>Да</button>
                    <button onClick={() => setModalVisible(false)}>Нет</button>
                </div>
                </>
            )}
            </div>
        </div>
        )}
    </div>
  );
}

export default Schedule
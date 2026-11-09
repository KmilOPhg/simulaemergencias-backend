import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
    esHoraInicio,
    esTipoEscenario,
    formatearFechaEjercicio,
    parsearFechaEjercicio,
} from "./emergencias.constants";

describe("ejercicios de emergencia", () => {
    it("acepta los escenarios aprobados y rechaza otros", () => {
        assert.equal(esTipoEscenario("SISMO"), true);
        assert.equal(esTipoEscenario("INCENDIO"), true);
        assert.equal(esTipoEscenario("INTRUSO"), true);
        assert.equal(esTipoEscenario("INUNDACION"), false);
        assert.equal(esTipoEscenario("sismo"), false);
    });

    it("acepta una fecha de calendario y conserva el mismo día", () => {
        const fecha = parsearFechaEjercicio("2026-10-26");
        assert.ok(fecha);
        assert.equal(formatearFechaEjercicio(fecha), "2026-10-26");
    });

    it("rechaza fechas imposibles o con otro formato", () => {
        assert.equal(parsearFechaEjercicio("2026-02-31"), null);
        assert.equal(parsearFechaEjercicio("26/10/2026"), null);
        assert.equal(parsearFechaEjercicio("2026-10-26T09:30:00"), null);
    });

    it("valida la hora de inicio en formato HH:mm", () => {
        assert.equal(esHoraInicio("09:30"), true);
        assert.equal(esHoraInicio("23:59"), true);
        assert.equal(esHoraInicio("24:00"), false);
        assert.equal(esHoraInicio("9:30"), false);
    });
});

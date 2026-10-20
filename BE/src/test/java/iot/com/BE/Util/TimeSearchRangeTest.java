package iot.com.BE.Util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

import java.time.LocalDateTime;

import org.junit.jupiter.api.Test;

class TimeSearchRangeTest {
    @Test
    void parsesYearMonthDateAndExactSecondRanges() {
        assertRange("2026", "2026-01-01T00:00", "2027-01-01T00:00");
        assertRange("2026-09", "2026-09-01T00:00", "2026-10-01T00:00");
        assertRange("2026-09-15", "2026-09-15T00:00", "2026-09-16T00:00");
        assertRange(
                "2026-05-10 19:55:32",
                "2026-05-10T19:55:32",
                "2026-05-10T19:55:33");
    }

    @Test
    void ignoresExtraWhitespaceAndRejectsInvalidDates() {
        assertRange("  2026-05-10   19:55:32  ",
                "2026-05-10T19:55:32",
                "2026-05-10T19:55:33");
        assertFalse(TimeSearchRange.parse("2026-02-30 19:55:32").isPresent());
    }

    private void assertRange(String query, String start, String end) {
        TimeSearchRange range = TimeSearchRange.parse(query).orElseThrow();
        assertEquals(LocalDateTime.parse(start), range.startInclusive());
        assertEquals(LocalDateTime.parse(end), range.endExclusive());
    }
}

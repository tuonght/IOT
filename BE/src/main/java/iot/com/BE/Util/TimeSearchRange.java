package iot.com.BE.Util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.format.ResolverStyle;
import java.util.Optional;
import java.util.regex.Pattern;

public record TimeSearchRange(LocalDateTime startInclusive, LocalDateTime endExclusive) {
    private static final Pattern YEAR = Pattern.compile("\\d{4}");
    private static final Pattern YEAR_MONTH = Pattern.compile("\\d{4}-\\d{2}");
    private static final Pattern DATE = Pattern.compile("\\d{4}-\\d{2}-\\d{2}");
    private static final Pattern MINUTE =
            Pattern.compile("\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}");
    private static final DateTimeFormatter DATE_TIME =
            DateTimeFormatter.ofPattern("uuuu-MM-dd HH:mm:ss")
                    .withResolverStyle(ResolverStyle.STRICT);

    public static Optional<TimeSearchRange> parse(String query) {
        String normalized = query == null ? "" : query.trim().replaceAll("\\s+", " ");
        try {
            if (YEAR.matcher(normalized).matches()) {
                LocalDateTime start = Year.parse(normalized).atDay(1).atStartOfDay();
                return Optional.of(new TimeSearchRange(start, start.plusYears(1)));
            }
            if (YEAR_MONTH.matcher(normalized).matches()) {
                LocalDateTime start = YearMonth.parse(normalized).atDay(1).atStartOfDay();
                return Optional.of(new TimeSearchRange(start, start.plusMonths(1)));
            }
            if (DATE.matcher(normalized).matches()) {
                LocalDateTime start = LocalDate.parse(normalized).atStartOfDay();
                return Optional.of(new TimeSearchRange(start, start.plusDays(1)));
            }
            if (MINUTE.matcher(normalized).matches()) {
                LocalDateTime start = LocalDateTime.parse(
                        normalized + ":00",
                        DATE_TIME);
                return Optional.of(new TimeSearchRange(start, start.plusMinutes(1)));
            }
            if (normalized.matches("\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}")) {
                LocalDateTime start = LocalDateTime.parse(normalized, DATE_TIME);
                return Optional.of(new TimeSearchRange(start, start.plusSeconds(1)));
            }
        } catch (DateTimeParseException exception) {
            return Optional.empty();
        }
        return Optional.empty();
    }
}

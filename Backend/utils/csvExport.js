import { Parser } from "json2csv";

export const exportCSV = (data) => {
  const parser = new Parser({
    fields: ["name", "email", "avgScore"],
  });
  return parser.parse(data);
};

"use client";

import { useState } from "react";
import Dropdown from "@/components/employee/Dropdown";

const title = "Employee Information";

const countryOptions = [
  "USA",
  "Germany",
  "France",
  "Canada",
  "India",
  "Poland",
  "Japan",
  "Spain",
  "Australia",
];

const languageOptions = ["English", "Spanish", "French", "German"];

export default function EmployeeInformationPage() {
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");

  return (
    <div>
      <h1 className="text-2xl font-bold text-center mt-8">{title}</h1>
      <div className="flex flex-col items-center justify-center mt-12">
        <section className="flex flex-col gap-4">
          <div data-testid="country-options">
            <Dropdown
              options={countryOptions}
              labelText="Select Country"
              onChange={setSelectedCountry}
            />
          </div>
          <div data-testid="language-options">
            <Dropdown
              options={languageOptions}
              labelText="Select Language"
              onChange={setSelectedLanguage}
            />
          </div>
          <label className="mt-8 text-center font-semibold">
            Final Selections:
          </label>
          <label className="text-center" data-testid="country-selected">
            {selectedCountry ? `Country Selected: ${selectedCountry}` : ""}
          </label>
          <label className="text-center" data-testid="language-selected">
            {selectedLanguage ? `Language Selected: ${selectedLanguage}` : ""}
          </label>
        </section>
      </div>
    </div>
  );
}

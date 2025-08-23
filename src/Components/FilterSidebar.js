import { X } from "lucide-react";
import React, { useState, useEffect } from "react";

const FilterSidebar = ({
  isOpen,
  onClose,
  onApplyFilters,
  minPrice = 0,
  maxPrice = 5000,
  // Add these props to receive current filter state from parent
  selectedRange: initialSelectedRange = null,
  selectedProductType: initialSelectedProductType = [],
  selectedPetTypes: initialSelectedPetTypes = [],
}) => {
  // Initialize state with props from parent
  const [selectedRange, setSelectedRange] = useState(initialSelectedRange);
  const [selectedProductType, setSelectedProductType] = useState(initialSelectedProductType);
  const [selectedPetTypes, setSelectedPetTypes] = useState(initialSelectedPetTypes);

  // Update local state when props change
  useEffect(() => {
    setSelectedRange(initialSelectedRange);
    setSelectedProductType(initialSelectedProductType);
    setSelectedPetTypes(initialSelectedPetTypes);
  }, [initialSelectedRange, initialSelectedProductType, initialSelectedPetTypes]);

  // Auto-apply filters only when there's an actual change (not on initial mount)
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Skip the first render to avoid applying filters on mount
    if (!isInitialized) {
      setIsInitialized(true);
      return;
    }

    // Check if any filters are actually selected
    const hasFilters = selectedRange !== null ||
      selectedProductType.length > 0 ||
      selectedPetTypes.length > 0;

    onApplyFilters?.({
      priceRange: selectedRange,
      productTypes: selectedProductType,
      petTypes: selectedPetTypes,
      showAll: !hasFilters // Pass a flag to indicate if all products should be shown
    });
  }, [selectedRange, selectedProductType, selectedPetTypes]);

  const predefinedRanges = [
    { label: "Below AED 100", min: 0, max: 100 },
    { label: "AED 100 - 300", min: 100, max: 300 },
    { label: "AED 300 - 600", min: 300, max: 600 },
    { label: "Above AED 600", min: 600, max: maxPrice },
  ];

  // Updated pet types to match database values (uppercase)
  const petTypes = [
    { label: "Cats", value: "CAT" },
    { label: "Dogs", value: "DOG" },
    { label: "Birds", value: "BIRD" },
    { label: "Fish", value: "FISH" },
  ];
  const petCounts = [526, 435, 50, 61];

  // Product types matching database values
  const productTypes = [
    { label: "Food", value: ["Food"] },
    { label: "Accessories", value: ["cage", "cat litter box", "scratcher"] }, // multiple internal values
    { label: "Collar", value: ["collar"] },
    { label: "Toys", value: ["Toy"] },
  ];

  const handlePetTypeToggle = (value) => {
    setSelectedPetTypes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    );
  };

  const handleProductTypeToggle = (label) => {
    setSelectedProductType((prev) =>
      prev.includes(label) ? prev.filter((t) => t !== label) : [...prev, label]
    );
  };

  const handleReset = () => {
    setSelectedRange(null);
    setSelectedProductType([]);
    setSelectedPetTypes([]);
    // The useEffect will automatically trigger onApplyFilters with empty values
  };

  return (
    <aside
      className={`fixed top-0 left-0 w-full sm:w-2/3 md:w-1/2 h-full bg-white p-4 sm:p-6 transition-transform transform z-50 overflow-y-auto max-h-screen
        ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        lg:relative lg:w-[250px] lg:translate-x-0 lg:block`}
    >
      <button
        className="lg:hidden sticky top-4 right-4 ml-auto block text-gray-600 z-50"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </button>

      {/* Pet Type */}
      <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Pet Type</h2>
      {petTypes.map(({ label, value }, index) => (
        <label
          key={value}
          className="flex items-center justify-between mb-2 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="petType"
              className="accent-orange-400"
              checked={selectedPetTypes.includes(value)}
              onChange={() => handlePetTypeToggle(value)}
            />
            <span className="text-sm">{label}</span>
          </div>
          <span className="text-xs text-gray-500">{petCounts[index]}</span>
        </label>
      ))}

      {/* Product Type */}
      <h2 className="text-lg sm:text-xl font-semibold mt-5 sm:mt-6 mb-3 sm:mb-4">
        Product Type
      </h2>
      <div className="grid grid-cols-2 gap-2 mb-6">
        {productTypes.map(({ label }) => (
          <button
            key={label}
            type="button"
            onClick={() => handleProductTypeToggle(label)}
            className={`px-3 py-2 rounded-full border text-sm w-full text-left ${selectedProductType.includes(label)
                ? "bg-orange-400 text-white border-orange-400"
                : "text-gray-600 border-gray-300 hover:border-orange-200 hover:bg-orange-50"
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Price Range */}
      <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Price</h2>
      <div className="flex flex-col gap-2 mb-5 sm:mb-6">
        {predefinedRanges.map((range) => (
          <label
            key={range.label}
            className={`flex items-center justify-between px-4 py-2 rounded-full border cursor-pointer ${selectedRange?.label === range.label
              ? "bg-orange-400 text-white border-orange-400"
              : "text-gray-600 border-gray-300 hover:border-orange-200 hover:bg-orange-50"
              }`}
          >
            <input
              type="radio"
              name="priceRange"
              value={range.label}
              checked={selectedRange?.label === range.label}
              onChange={() => setSelectedRange(range)}
              className="hidden"
            />
            <span className="text-sm">{range.label}</span>
          </label>
        ))}
      </div>

      <button
        className="w-full border border-gray-300 rounded-full py-2 text-sm hover:bg-gray-50 transition-colors"
        onClick={handleReset}
      >
        Reset
      </button>
      
      {/* OK Button for Mobile */}
      <button
        className="lg:hidden xl:hidden mt-4 w-full bg-orange-400 text-white py-2 rounded-full hover:bg-orange-500 transition-colors"
        onClick={onClose}
      >
        OK
      </button>
    </aside>
  );
};

export default FilterSidebar;
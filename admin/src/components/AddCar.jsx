import { memo, useState, useRef, useCallback } from 'react';
import { AddCarPageStyles as s, toastStyles as t } from '../assets/dummyStyles';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';

const baseURL = "https://kar-rental-backend.vercel.app";
const api = axios.create({ baseURL });

const AddCar = () => {
    const initialFormData = {
        carName: "",
        dailyPrice: "",
        seats: "",
        fuelType: "Petrol",
        mileage: "",
        transmission: "Automatic",
        year: "",
        model: "",
        description: "",
        category: "Sedan",
        image: null,
        imagePreview: null,
    };

    const [data, setData] = useState(initialFormData);
    const fileRef = useRef(null);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setData((prev) => ({ ...prev, [name]: value }));
    }, []);

    // FOR IMG HANDLING
    const handleImageChange = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) =>
            setData((prev) => ({
                ...prev,
                image: file,
                imagePreview: evt.target.result,
            }));
        reader.readAsDataURL(file);
    }, []);

    const resetForm = useCallback(() => {
        setData(initialFormData);
        if (fileRef.current) fileRef.current.value = '';
    }, [initialFormData]);

    const showToast = useCallback((type, title, message, icon) => {
        const toastConfig = {
            position: "top-right",
            className: t[type].container,
            bodyClassName: t[type].body,
        };

        if (type === "success") {
            toastConfig.autoClose = 3000;
        } else {
            toastConfig.autoClose = 4000;
        }

        toast[type](
            <div className="flex items-center">
                {icon}
                <div>
                    <p
                        className={
                            type === "success" ? "font-bold text-lg" : "font-semibold"
                        }
                    >
                        {title}
                    </p>
                    <p>{message}</p>
                </div>
            </div>,
            toastConfig
        );
    }, []);

    // HANDLE SUBMIT
    const handleSubmit = async (e) => {
        e.preventDefault();
        const carNameForToast = data.carName || "";

        try {
            const formData = new FormData();
            const fieldMappings = {
                make: data.carName,
                dailyRate: data.dailyPrice,
                seats: data.seats,
                fuelType: data.fuelType,
                mileage: data.mileage,
                transmission: data.transmission,
                year: data.year,
                model: data.model,
                description: data.description || "",
                color: "",
                category: data.category,
            };

            Object.entries(fieldMappings).forEach(([key, value]) => {
                formData.append(key, value);
            });

            if (data.image) formData.append("image", data.image);

            await api.post("/api/cars", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            showToast(
                "success",
                "Congratulations!",
                `Your ${carNameForToast} has been listed successfully`,
                <svg
                    className={s.iconLarge}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                    ></path>
                </svg>
            );

            resetForm();
        } catch (err) {
            console.error("Failed to submit car:", err);
            const msg =
                err.response?.data?.message || err.message || "Failed to list car";

            showToast(
                "error",
                "Error",
                msg,
                <svg
                    className={s.iconMedium}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                    ></path>
                </svg>
            );
        }
    };

    const renderInputField = (field) => (
        <div key={field.name}>
            <label className={field.icon ? s.labelWithIcon : s.label}>
                {field.icon}
                {field.name}
            </label>

            <input required={field.required} name={field.name} value={data[field.name]} onChange={handleChange} type={field.type || 'text'}
                className={field.prefix ? s.inputWithPrefix : s.input} placeholder={field.placeholder} min={field.min} max={field.max} {...field.props} />
        </div>
    );

    const renderSelectField = (field) => (
        <div key={field.name}>
            <label className={s.label}>{field.label}</label>
            <select required={field.required} name={field.name} value={data[field.name]} onChange={handleChange} className={s.select}>
                {field.options.map((option) =>
                    typeof option === 'object' ? (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ) : (
                        <option value={option} key={option}>
                            {option}
                        </option>
                    )
                )}
            </select>
        </div>
    );

    const leftColumnFields = [
        {
            type: "input",
            config: {
                name: "carName",
                label: "Car Name",
                required: true,
                placeholder: "e.g., Toyota Camry",
                icon: (
                    <svg
                        className={s.iconSmall}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                        ></path>
                    </svg>
                ),
            },
        },
        {
            type: "input",
            config: {
                name: "dailyPrice",
                label: "Daily Price (₹)",
                type: "number",
                required: true,
                min: "1",
                placeholder: "4500",
                props: { className: "pl-8" },
                prefix: <span className="absolute left-3 top-3 text-gray-400">₹</span>,
            },
        },
        {
            type: "select",
            config: {
                name: "seats",
                label: "Seats",
                required: true,
                options: [2, 4, 5, 6, 7, 8].map((n) => ({
                    value: n,
                    label: `${n} seats`,
                })),
            },
        },
        {
            type: "select",
            config: {
                name: "fuelType",
                label: "Fuel Type",
                required: true,
                options: ["Petrol", "Diesel", "Electric", "Hybrid", "CNG"],
            },
        },
        {
            type: "input",
            config: {
                name: "mileage",
                label: "Mileage (MPG)",
                type: "number",
                required: true,
                min: "1",
                placeholder: "28",
            },
        },
        {
            type: "select",
            config: {
                name: "category",
                label: "Category",
                required: true,
                options: ["Sedan", "SUV", "Sports", "Coupe", "Hatchback", "Luxury"],
            },
        },
    ];

    const rightColumnFields = [
        {
            type: "input",
            config: {
                name: "year",
                label: "Year",
                type: "number",
                required: true,
                min: "1990",
                max: new Date().getFullYear(),
                placeholder: "2020",
            },
        },
        {
            type: "input",
            config: {
                name: "model",
                label: "Model",
                required: true,
                placeholder: "e.g., XLE",
            },
        },
    ];

    return (
        <div className={s.pageContainer}>
            <div className={s.fixedBackground}>
                <div className={s.gradientBlob1} />
                <div className={s.gradientBlob2} />
                <div className={s.gradientBlob3} />
            </div>

            <div className={s.headerContainer}>
                <div className={s.headerDivider}>
                    <div className={s.headerDividerLine} />
                </div>
                <h1 className={s.title}>
                    <span className={s.titleGradient}>Add Your Car</span>
                </h1>
                <p className={s.subtitle}>Share your vehicle with the world and start earning today.</p>
            </div>

            <div className={s.formContainer}>
                <form onSubmit={handleSubmit} className={s.form}>
                    <div className={s.formGrid}>
                        <div className={s.formColumn}>
                            {leftColumnFields.map((field) => {
                                if (field.type === "input") {
                                    return (
                                        <div key={field.config.name}>
                                            <label className={s.label}>
                                                {field.config.label}
                                            </label>
                                            <div className='relative'>
                                                {field.config.prefix}

                                                <input required={field.config.required} name={field.config.name} value={data[field.config.name]} onChange={handleChange}
                                                    type={field.config.type || 'text'} className={`${s.input} ${field.config.props?.className || ''}`}
                                                    placeholder={field.config.placeholder} min={field.config.min} max={field.config.max} />
                                            </div>
                                        </div>
                                    );
                                }
                                else if (field.type === "select") {
                                    return renderSelectField(field.config);
                                }
                                return null;
                            })}

                            <div>
                                <label className={s.label}>Transmission</label>
                                <div className={s.radioContainer}>
                                    {['Automatic', 'Manual'].map((t) => (
                                        <label key={t} className={s.radioLabel(data.transmission === t)}>
                                            <input type='radio' name='transmission' value={t} checked={data.transmission === t} onChange={handleChange} className={s.radioInput} />
                                            <span className={s.radioText}>{t}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className={s.formColumn}>
                            <div className={s.formGridInner}>
                                {rightColumnFields.map((field) => {
                                    if (field.type === "input") {
                                        return renderInputField(field.config);
                                    }
                                    return null;
                                })}
                            </div>-

                            <div>
                                <label className={s.label}>Car Image</label>
                                <div className={s.imageUploadContainer}>
                                    <label className={s.imageUploadLabel}>
                                        {data.imagePreview ? (
                                            <div className="w-full h-full rounded-xl overflow-hidden">
                                                <img src={data.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className={s.imageUploadPlaceholder}>
                                                <svg
                                                    className={s.iconUpload}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                    ></path>
                                                </svg>
                                                <p className={s.imageUploadText}>
                                                    <span className={s.imageUploadTextSemibold}>Click to upload</span><br /> or drag and drop
                                                </p>
                                                <p className={s.imageUploadSubText}>PNG, JPG upto 5MB</p>
                                            </div>
                                        )}

                                        <input type='file' ref={fileRef} name="image" onChange={handleImageChange} className='hidden' accept="image/*" />
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className={s.label}>Description</label>
                                <textarea required name='description' value={data.description} onChange={handleChange} rows="4" className={s.textarea} placeholder='Describe features, conditions, special details...' />
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 flex justify-center">
                        <button type='submit' className={s.submitButton}>
                            <span className={s.buttonText}>List Your Car</span>
                            <svg
                                className={s.iconInline}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6">
                                </path>
                            </svg>
                        </button>
                    </div>
                </form>
            </div>

            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                closeOnClick
                pauseOnHover
                draggable
                pauseOnFocusLoss
                theme="dark"
            />
        </div>
    );
};

export default memo(AddCar);
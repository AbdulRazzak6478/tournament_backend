import React, { useState } from "react";
import { PiGreaterThan } from "react-icons/pi";
import { Select, Option, ThemeProvider } from "@material-tailwind/react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_green.css";
import { FaCalendarDays } from "react-icons/fa6";
// import { Icon } from "@iconify/react";
import { useNavigate, useParams } from "react-router-dom";
import { RxCross2 } from "react-icons/rx";
import uploadImage from "../../../../assets/upload-image.svg";
import { MdCloudUpload } from "react-icons/md";
import { selectCustomTheme } from "../../../../helpers/constants";
import { useAuth } from "../../../../store/AuthContext";
import { APIurls } from "../../../../api/apiConstant";
import { useQuery } from "react-query";
import { useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";

export default function EditOverViewTournament() {
    const navigate = useNavigate();
    const [showError, setShowError] = useState(false);
    const [reqError, setReqError] = useState("");
    const [mainCategorySport, setMainCategorySport] = useState("");
    const [subCategorySport, setSubCategorySport] = useState("");
    const [selectType, setSelectType] = useState("");
    const [formatType, setFormatType] = useState("");
    const [fixingType, setFixingType] = useState("");
    const [handleStartDate, setHandleStartDate] = useState("");
    const [handleEndDate, setHandleEndDate] = useState("");
    const [aboutTournament, setAboutTournament] = useState("");
    const [participants, setParticipants] = useState(null);
    const [selectSport, setSelectSport] = useState("");
    const [tournamentName, setTournamentName] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [subCategories, setSubCategories] = useState([]);
    const [mainCategoryData, setMainCategoryData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [status,setStatus] = useState("");
    const { tournamentId } = useParams();
    const { getAccessToken } = useAuth();

    const fetchMainCategories = async () => {
        const token = await getAccessToken();
        // setIsLoading(true);
        const response = await fetch(`${APIurls.fetchCategories}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        const result = await response.json();
        // setIsLoading(false);
        if (!response.ok) {
            throw new Error(result?.message);
        }
        console.log("fetch categories in update tournament ", result);
        setMainCategoryData(result?.response?.CatArray)
        // return result?.response?.CatArray;
    };
    const fetchTournamentDetails = async () => {
        try {
            const token = await getAccessToken();
            setIsLoading(true);
            const response = await fetch(
                `${APIurls.fetchOverViewTournamentData}/${tournamentId}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            const result = await response.json();
            console.log("tournament details ", result?.response?.tournamentDetails);
            if (!response.ok) {
                throw new Error(result.message);
            }
            setIsLoading(false);
            // BannerImg
            let resData = result?.response?.tournamentDetails;
            setMainCategorySport(resData?.mainCategoryID);
            setPreviewImage(resData?.BannerImg);
            setSubCategorySport(resData?.subCategoryID);
            setSelectType(resData?.tournamentType);
            setFormatType(resData?.format);
            setFixingType(resData?.fixingType);
            setHandleStartDate(resData?.startDate);
            setHandleEndDate(resData?.endDate);
            setAboutTournament(resData?.description);
            setParticipants(resData?.participants);
            setSelectSport(resData?.sportName);
            setTournamentName(resData?.tournamentName);
            setStatus(resData.status);
            return result?.response?.tournamentDetails;
        } catch (error) {
            setIsLoading(false);
            console.log("error in fetching tournament details : ", error?.message);
            let message = "Error in getting tournament details " + error?.message;
            setReqError(message);
        }
    };

    //   const {
    //     data: mainCategoryData,
    //     // isLoading,
    //     // refetch,
    //   } = useQuery("mainCategoriesUpdate", fetchMainCategories);
    //   const {
    //     data: tournamentDetails,
    //     // isLoading,
    //     // refetch,
    //   } = useQuery("overviewTournamentDetails", fetchTournamentDetails);

    useEffect(() => {
        (async () => {
            await fetchMainCategories();
            //   setMainCategoryData(data);
            await fetchTournamentDetails();
        })();
        // fetchMainCategories()
    }, []);

    const updateTournamentDetails = async (formData) => {
        const token = await getAccessToken();
        const response = await fetch(
            `${APIurls.updateTournamentDetails}/${tournamentId}`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            }
        );
        const result = await response.json();
        console.log("tournament update response ", result);
        if (result.code > 201) {
            toast.error(result?.message);
            throw new Error(result?.message);
        }
        toast.success("Tournament updated Successfully");
        return result?.response;
    };
    const handleSave = async (e) => {
        e.preventDefault();
        try {
            console.log("Form Submitted");
            if (
                !mainCategorySport ||
                !selectType ||
                !formatType ||
                !fixingType ||
                !handleStartDate ||
                !aboutTournament ||
                !subCategorySport ||
                !participants ||
                !selectSport ||
                !tournamentName ||
                !handleEndDate
            ) {
                setShowError(true);
                return;
            } else {
                setShowError(false);
            }
            let gameType = selectType === "Team Match" ? "team" : "individual";

            let formatName = "";
            if (formatType === "Knockout") {
                formatName = "knockout";
            }
            if (formatType === "Double Elimination Bracket") {
                formatName = "double_elimination_bracket";
            }
            if (formatType === "Round Robbin") {
                formatName = "round_robbin";
            }
            const formData = new FormData();
            formData.append("name", tournamentName);
            formData.append("mainCategoryID", mainCategorySport);
            formData.append("subCategoryID", subCategorySport);
            formData.append("gameType", gameType);
            formData.append("fixingType", fixingType);
            formData.append("participants", participants);
            formData.append("formatType", formatName);
            formData.append("sportName", selectSport);
            formData.append("startDate", handleStartDate);
            formData.append("endDate", handleEndDate);
            formData.append("description", aboutTournament);
            formData.append("BannerImg", selectedFile);

            //   console.log("selected file", selectedFile);
            // Log formData entries
            //   for (const [key, value] of formData.entries()) {
            //     console.log(`${key}: ${value}`);
            //   }

            setIsSaving(true);
            const updatedResponse = await updateTournamentDetails(formData);

            setIsSaving(false);
            console.log("success response : ", updatedResponse);
            setTimeout(
                () => navigate(`/tournaments/tournamentDetails/${tournamentId}`),
                2500
            );
        } catch (error) {
            setIsSaving(false);
            console.log("error in saving tournament details :", error?.message);
        }
    };

    const handleFileInput = (event) => {
        const file = event.target.files[0];
        if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
            setSelectedFile(file);
            console.log("img : ", URL.createObjectURL(file));
            setPreviewImage(URL.createObjectURL(file));
        } else {
            alert("Please select a valid image file (jpeg or png).");
        }
    };

    const triggerFileInput = () => {
        document.getElementById("fileInput").click();
    };
    useEffect(() => {
        if (mainCategorySport !== "") {
            let mainCat = mainCategoryData?.find(
                (div) => div?._id === mainCategorySport
            );
            setSubCategories(
                mainCat?.subCategoriesId?.map((div) => {
                    return { _id: div?._id, categoryName: div?.subCategoryName };
                })
            );
        }
    }, [mainCategorySport, mainCategoryData]);

    return (
        <>
            <ThemeProvider value={selectCustomTheme}>
                <form onSubmit={handleSave}>
                    <div className="flex justify-between p-3">
                        <div className="flex items-center">
                            <p
                                className="text-[#808080] font-semibold text-base cursor-pointer"
                                onClick={() => navigate("/tournaments")}
                            >
                                Tournament
                            </p>
                            <PiGreaterThan className="text-[#808080]" />
                            <p
                                className="text-[#808080] font-semibold text-base cursor-pointer"
                                onClick={() =>
                                    navigate(`/tournaments/tournamentDetails/${tournamentId}`)
                                }
                            >
                                Overview of the Tournament
                            </p>
                            <PiGreaterThan className="text-[#808080]" />
                            <p className="text-xl font-semibold">Tournament Details</p>
                        </div>
                        <button
                            className={`flex items-center ${isSaving
                                ? "bg-green-600 text-white cursor-not-allowed"
                                : "bg-[#FB6108] text-white cursor-pointer"
                                }  px-4 py-2 rounded-md gap-2 text-base float-right`}
                            disabled={isSaving}
                        >
                            {/* <p>Save</p> */}
                            {isSaving ? <p>Saving...</p> : <p>Save</p>}
                            <PiGreaterThan />
                        </button>
                    </div>
                    {isLoading && (
                        <h1 className="text-center mt-[4rem] font-bold text-xl">
                            L o a d i n g . . .{" "}
                        </h1>
                    )}
                    {!isLoading && (
                        <div className="flex gap-[3rem] px-[2rem] py-[3rem]">
                            <div className="flex flex-col gap-[1.5rem] flex-[2]">
                                {/*Sport Category DropDown*/}

                                {mainCategoryData?.length > 0 && (
                                    <>
                                        <Select
                                            label="Select Main Category"
                                            className={`bg-[#F6F7FB] ${status === 'PENDING' ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                            size="lg"
                                            value={mainCategorySport}
                                            onChange={(value) => setMainCategorySport(value)}
                                            disabled={status === 'PENDING' ? false : true}
                                        >
                                            {mainCategoryData?.map((category) => {
                                                return (
                                                    <Option key={category._id} value={category._id}>
                                                        {category?.categoryName}
                                                    </Option>
                                                );
                                            })}
                                        </Select>
                                    </>
                                )}
                                {!mainCategorySport && showError && (
                                    <p className="text-sm text-red-500 mt-[-15px]">
                                        This field is required
                                    </p>
                                )}
                                {/*Select Type DropDown*/}
                                <Select
                                    label="Select type"
                                    className="bg-[#F6F7FB] cursor-not-allowed"
                                    size="lg"
                                    value={selectType}
                                    onChange={(value) => setSelectType(value)}
                                    disabled={true}
                                >
                                    <Option value="Team Match">Team Match</Option>
                                    <Option value="Individual">Individual</Option>
                                </Select>
                                {!selectType && showError && (
                                    <p className="text-sm text-red-500 mt-[-15px]">
                                        *This field is required
                                    </p>
                                )}
                                {/*Select Format DropDown*/}
                                <Select
                                    label="Select Format"
                                    className="bg-[#F6F7FB] cursor-not-allowed"
                                    size="lg"
                                    value={formatType}
                                    onChange={(value) => setFormatType(value)}
                                    disabled={true}
                                >
                                    <Option value="Knockout">Knockout</Option>
                                    <Option value="Double Elimination Bracket">
                                        Double-Elimination Bracket
                                    </Option>
                                    <Option value="Round Robbin">Round Robbin</Option>
                                </Select>
                                {!formatType && showError && (
                                    <p className="text-sm text-red-500 mt-[-15px]">
                                        *This field is required
                                    </p>
                                )}
                                {/*Fixing Type DropDown*/}
                                <Select
                                    label="Fixing Type"
                                    className={`bg-[#F6F7FB] ${status === 'PENDING' ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                    size="lg"
                                    value={fixingType}
                                    onChange={(value) => setFixingType(value)}
                                    disabled={status === 'PENDING' ? false : true}
                                >
                                    <Option value="random">Random</Option>
                                    <Option value="manual">Manual</Option>
                                    <Option value="sequential">Sequential</Option>
                                    <Option value="top_vs_bottom">Top Vs Bottom</Option>
                                    <Option value="seeding">Seeding</Option>
                                </Select>
                                {!fixingType && showError && (
                                    <p className="text-sm text-red-500 mt-[-15px]">
                                        *This field is required
                                    </p>
                                )}
                                <div className="flex items-center border bg-[#F6F7FB] rounded px-2 py-1">
                                    <Flatpickr
                                        value={handleStartDate}
                                        onChange={(value) => setHandleStartDate(value)}
                                        options={{ dateFormat: "Y-m-d" }}
                                        className="flatpickr-input border-0 h-8 outline-none flex-grow bg-[#F6F7FB]"
                                        placeholder="Start Date"
                                    />
                                    {handleStartDate === "" ? (
                                        <FaCalendarDays className="text-[1.2rem] bg-[#808080] text-white ml-2 cursor-pointer" />
                                    ) : (
                                        <RxCross2
                                            className="text-[1.2rem] text-red-600 border border-red-600 cursor-pointer"
                                            onClick={() => setHandleStartDate("")}
                                        />
                                    )}
                                </div>
                                {!handleStartDate && showError && (
                                    <p className="text-sm text-red-500 mt-[-15px]">
                                        *This field is required
                                    </p>
                                )}
                                <textarea
                                    className="p-3 bg-[#F6F7FB] outline-none"
                                    placeholder="About Tournament"
                                    value={aboutTournament}
                                    rows={8}
                                    onChange={(e) => setAboutTournament(e.target.value)}
                                />
                                {!aboutTournament && showError && (
                                    <p className="text-sm text-red-500 mt-[-15px]">
                                        *This field is required
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col gap-[1.5rem] flex-[2]">
                                {/*Sub Category Drop Down*/}

                                {subCategories?.length > 0 ? (
                                    <>
                                        <Select
                                            label="Select Sub Category Sport"
                                            className={`bg-[#F6F7FB] ${status === 'PENDING' ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                            size="lg"
                                            value={subCategorySport}
                                            onChange={(value) => setSubCategorySport(value)}
                                            disabled={status === 'PENDING' ? false : true}
                                        >
                                            {subCategories?.map((category) => {
                                                return (
                                                    <Option value={category?._id} key={category?._id}>
                                                        {category?.categoryName}
                                                    </Option>
                                                );
                                            })}
                                        </Select>
                                    </>
                                ) : (
                                    <Select label="Select Sub Category Sport">
                                        <Option value=" ">" "</Option>
                                    </Select>
                                )}
                                {!subCategorySport && showError && (
                                    <p className="text-sm text-red-500 mt-[-15px]">
                                        This field is required
                                    </p>
                                )}
                                <input
                                    type="text"
                                    className={`text-[0.75rem] sm:text-[1rem] font-[500] py-[0.6rem] px-[1rem] bg-[#F6F7FB] ${status === 'PENDING' ? '' : 'cursor-not-allowed'} placeholder:text-[#7F7F7F] rounded-md outline-none`}
                                    placeholder="Enter Number of Participants"
                                    value={participants}
                                    onChange={(e) => setParticipants(e.target.value)}
                                    disabled={status === 'PENDING' ? false : true}
                                />
                                {!participants && showError && (
                                    <p className="text-sm text-red-500 mt-[-15px]">
                                        *This field is required
                                    </p>
                                )}
                                {/*Select Sport*/}
                                <Select
                                    label="Select Sport"
                                    className={`bg-[#F6F7FB] ${status === 'PENDING' ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                    size="lg"
                                    value={selectSport}
                                    onChange={(value) => setSelectSport(value)}
                                    disabled={status === 'PENDING' ? false : true}
                                >
                                    <Option value="cricket">Cricket</Option>
                                    <Option value="badminton">Badminton</Option>
                                </Select>
                                {!selectSport && showError && (
                                    <p className="text-sm text-red-500 mt-[-15px]">
                                        *This field is required
                                    </p>
                                )}
                                <input
                                    type="text"
                                    className="text-[0.75rem] sm:text-[1rem] font-[500] py-[0.6rem] px-[1rem] bg-[#F6F7FB] placeholder:text-[#7F7F7F] rounded-md outline-none"
                                    placeholder="Tournament Name"
                                    value={tournamentName}
                                    onChange={(e) => setTournamentName(e.target.value)}
                                />
                                {!tournamentName && showError && (
                                    <p className="text-sm text-red-500 mt-[-15px]">
                                        *This field is required
                                    </p>
                                )}
                                <div className="flex items-center border rounded px-2 py-1 bg-[#F6F7FB]">
                                    <Flatpickr
                                        value={handleEndDate}
                                        options={{ dateFormat: "Y-m-d" }}
                                        className="flatpickr-input border-0 outline-none h-8 flex-grow bg-[#F6F7FB]"
                                        placeholder="End Date"
                                        onChange={(value) => setHandleEndDate(value)}
                                    />
                                    {handleEndDate === "" ? (
                                        <FaCalendarDays className="text-[1.2rem] text-white ml-2 cursor-pointer bg-[#808080]" />
                                    ) : (
                                        <RxCross2
                                            className="text-[1.2rem] text-red-600 border border-red-600 cursor-pointer"
                                            onClick={() => setHandleEndDate("")}
                                        />
                                    )}
                                </div>
                                {!handleEndDate && showError && (
                                    <p className="text-sm text-red-500 mt-[-15px]">
                                        *This field is required
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col w-[30%] h-[250px] items-center justify-center bg-[#F4F5FA]">
                                <div className="w-[100%] flex justify-center">
                                    {previewImage ? (
                                        <img
                                            src={previewImage}
                                            alt="Selected"
                                            className=" w-[100%]"
                                        />
                                    ) : (

                                        <div>
                                            <div className="flex justify-center items-center">
                                                <img src={uploadImage} className="w-10 " alt="upload ing" />
                                            </div>
                                            <div
                                                className="text-primary flex items-center gap-3 cursor-pointer justify-center"
                                                onClick={triggerFileInput}
                                            >
                                                <MdCloudUpload className="w-[2rem] h-[2rem]" />
                                                <p>Upload Banner</p>
                                            </div>
                                            <p className="text-[#808080] text-sm">
                                                Upload an image of Tournament
                                            </p>
                                            <p className="text-[0.8rem] text-[#808080] text-center">
                                                File Format <span className="text-black"> jpeg, png </span>
                                                <br />
                                                Recommended Size{" "}
                                                <span className="text-black"> 600x600 (1:1) </span>
                                            </p>
                                            <input
                                                type="file"
                                                id="fileInput"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleFileInput}
                                            />

                                        </div>
                                    )}

                                </div>

                                {
                                    previewImage === "" ? (
                                        "") : ""
                                }
                                <div>
                                    {previewImage ? (
                                        <RxCross2
                                            className="cursor-pointer border border-[#808080]"
                                            onClick={() => setPreviewImage("")}
                                        />
                                    ) : (
                                        ""
                                    )}
                                </div>
                            </div>
                            {/* {
                            !previewImage && showError && (
                                <p className='text-sm text-red-500 mt-[-15px]'>*This field is required</p>
                            )
                        } */}
                        </div>
                    )}
                </form>
                <ToastContainer />
            </ThemeProvider>
        </>
    );
}

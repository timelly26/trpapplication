import { Users, Mail, Phone, MapPin, Bookmark } from "lucide-react";

interface StudentProfileProps {
  name: string;
  id: string;
  className: string;
  rollNo: string;
  age: string;
  email: string;
  phone: string;
  address: string;
  photoUrl?: string | null;
}

type Props = {
  student: StudentProfileProps;
  fatherName?: string;
  fatherOccupation?: string;
  fatherPhone?: string;
  motherName?: string;
  motherOccupation?: string;
};

export const ProfileSidebar = ({
  student,
  fatherName = "",
  fatherOccupation = "",
  fatherPhone = "",
  motherName = "",
  motherOccupation = "",
}: Props) => (
  <div className="space-y-6">
    {/* Student Identity Card */}
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-4 text-center shadow-xl">
      <div className="relative w-32 h-32 mx-auto mb-6">
        <img
          src={student.photoUrl || "/avatar.jpg"}
          className="rounded-[2rem] border-2 border-[#b4f44d] object-cover w-full h-full shadow-lg"
          alt={student.name}
        />
        <span className="absolute -bottom-2 -right-2 bg-[#b4f44d] text-[#2d243a] p-2 rounded-xl shadow-md">
          <Bookmark size={16} fill="currentColor" />
        </span>
      </div>
      
      <h3 className="text-2xl font-bold text-white mb-1">{student.name}</h3>
      <p className="text-[#b4f44d] text-sm font-mono tracking-widest mb-8 uppercase opacity-80">{student.id}</p>
      
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-white/5 py-3  rounded-2xl border border-white/5">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Class</p>
          <p className="text-sm font-bold text-white">{student.className}</p>
        </div>
        <div className="bg-white/5 py-3 rounded-2xl border border-white/5">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Roll No</p>
          <p className="text-sm font-bold text-white">{student.rollNo}</p>
        </div>
        <div className="bg-white/5 py-3 rounded-2xl border border-white/5">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Age</p>
          <p className="text-sm font-bold text-white">{student.age}</p>
        </div>
      </div>

      <div className="text-left space-y-2 pt-6 border-t border-white/5">
        <div className="flex items-center gap-4 text-gray-300">
          <div className=" rounded-lg"><Mail size={16} className="text-[#b4f44d]" /></div>
          <span className="text-sm truncate">{student.email}</span>
        </div>
        <div className="flex items-center gap-4 text-gray-300">
          <div className=" rounded-lg"><Phone size={16} className="text-[#b4f44d]" /></div>
          <span className="text-sm">{student.phone}</span>
        </div>
        <div className="flex items-center gap-4 text-gray-300">
          <div className="  rounded-lg"><MapPin size={16} className="text-[#b4f44d]" /></div>
          <span className="text-sm leading-snug">{student.address}</span>
        </div>
      </div>
    </div>

    {/* Parent Details Card */}
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-4 shadow-xl">
      <h4 className="text-[#b4f44d] font-bold mb-6 flex items-center gap-3 text-lg">
        <Users className="w-6 h-6" /> Parents Details
      </h4>
      
      <div className="space-y-6">
        {/* Father Info */}
        <div className="space-y-3">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Father / Guardian</label>
          <div className="grid grid-cols-1 gap-2">
            <div className="bg-white/5 py-2 px-2 rounded-2xl border border-white/5">
              <p className="text-[10px] text-gray-500 font-bold uppercase">Name</p>
              <p className="text-xs font-bold text-white">{fatherName || "Not Provided"}</p>
            </div>
            <div className="bg-white/5 py-2 px-2 rounded-2xl border border-white/5">
              <p className="text-[10px] text-gray-500 font-bold uppercase">Occupation</p>
              <p className="text-xs font-bold text-white">{fatherOccupation || "-"}</p>
            </div>
          </div>
        </div>

        {/* Mother Info */}
        <div className="space-y-3">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Mother</label>
          <div className="grid grid-cols-1 gap-2">
            <div className="bg-white/5 py-2 px-2 rounded-2xl border border-white/5">
              <p className="text-[10px] text-gray-500 font-bold uppercase">Name</p>
              <p className="text-xs font-bold text-white">{motherName || "Not Provided"}</p>
            </div>
            <div className="bg-white/5 py-2 px-2 rounded-2xl border border-white/5">
              <p className="text-[10px] text-gray-500 font-bold uppercase">Occupation</p>
              <p className="text-xs font-bold text-white">{motherOccupation || "-"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
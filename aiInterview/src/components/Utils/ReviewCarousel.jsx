// import React, { useRef } from "react";

// // Expanded reviews list
// const reviews = [
//   {
//     name: "Sarah Mitchell",
//     role: "HR Manager, TechNova",
//     avatar: "https://i.pravatar.cc/100?img=47",
//     stars: 5,
//     review:
//       "This AI interview system completely transformed our hiring workflow. We reduced screening time by 60% and improved candidate quality noticeably.",
//   },
//   {
//     name: "Amit Verma",
//     role: "Talent Lead, CloudWave",
//     avatar: "https://i.pravatar.cc/100?img=32",
//     stars: 5,
//     review:
//       "The analytics and scoring system are absolutely game-changing. It gives insights we could never gather manually.",
//   },
//   {
//     name: "Julia Gomez",
//     role: "Recruiter, BrightHire",
//     avatar: "https://i.pravatar.cc/100?img=15",
//     stars: 4,
//     review:
//       "Super intuitive, easy to use, and the automated interviews save hours of work every week.",
//   },
//   {
//     name: "Marcus Levy",
//     role: "Hiring Director, SkillForge",
//     avatar: "https://i.pravatar.cc/100?img=68",
//     stars: 5,
//     review:
//       "Real-time feedback and personality insights helped us make more confident hiring decisions. Highly recommended!",
//   },
//   {
//     name: "Linda Sharma",
//     role: "Recruiter, TalentHub",
//     avatar: "https://i.pravatar.cc/100?img=23",
//     stars: 4,
//     review:
//       "We saved countless hours in screening and shortlisting. The insights are incredibly accurate!",
//   },
//   {
//     name: "David Ross",
//     role: "CEO, BuildScale",
//     avatar: "https://i.pravatar.cc/100?img=12",
//     stars: 5,
//     review:
//       "Best AI hiring system we've tried. The personality analytics alone are worth the investment.",
//   },
//   {
//     name: "Emily Carter",
//     role: "HR Lead, BrightTeams",
//     avatar: "https://i.pravatar.cc/100?img=56",
//     stars: 5,
//     review:
//       "Very polished platform. Candidates love the experience and we get clear insights instantly.",
//   },
// ];

// const ReviewCarousel = () => {
//   const scrollRef = useRef(null);

//   // Drag vars
//   let isDown = false;
//   let startX = 0;
//   let scrollLeft = 0;

//   const startDragging = (e) => {
//     isDown = true;
//     scrollRef.current.classList.add("grabbing");
//     startX = e.pageX || e.touches?.[0].pageX;
//     scrollLeft = scrollRef.current.scrollLeft;
//   };

//   const stopDragging = () => {
//     isDown = false;
//     scrollRef.current.classList.remove("grabbing");
//   };

//   const onDrag = (e) => {
//     if (!isDown) return;
//     e.preventDefault();
//     const x = e.pageX || e.touches?.[0].pageX;
//     const walk = (x - startX) * 1.2;
//     scrollRef.current.scrollLeft = scrollLeft - walk;
//   };

//   return (
//     <section className="py-16 md:py-24 bg-gray-100">
//       <div className="max-w-7xl mx-auto px-4 lg:px-8">

//         {/* Title */}
//         <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
//           What Our Customers Say
//         </h2>

//         {/* DRAG-TO-SCROLL CAROUSEL */}
//         <div
//           ref={scrollRef}
//           className="
//           flex gap-6 overflow-x-auto scrollbar-hide cursor-grab py-4 select-none
//           "
//           onMouseDown={startDragging}
//           onMouseLeave={stopDragging}
//           onMouseUp={stopDragging}
//           onMouseMove={onDrag}
//           onTouchStart={startDragging}
//           onTouchEnd={stopDragging}
//           onTouchMove={onDrag}
//         >
//           {reviews.map((review, index) => (
//             <div
//               key={index}
//               className="
//                 min-w-[300px] md:min-w-[350px] 
//                 bg-white rounded-xl shadow-md hover:shadow-xl 
//                 transition p-6 border border-gray-200
//               "
//             >
//               {/* Avatar + Info */}
//               <div className="flex items-center gap-4 mb-4">
//                 <img
//                   src={review.avatar}
//                   alt={review.name}
//                   className="w-14 h-14 rounded-full shadow"
//                 />
//                 <div>
//                   <h4 className="font-semibold text-gray-900">{review.name}</h4>
//                   <p className="text-sm text-gray-600">{review.role}</p>
//                 </div>
//               </div>

//               {/* Stars */}
//               <div className="flex mb-3">
//                 {"★".repeat(review.stars).split("").map((_, i) => (
//                   <span key={i} className="text-yellow-500 text-lg">★</span>
//                 ))}
//                 {"★".repeat(5 - review.stars).split("").map((_, i) => (
//                   <span key={i} className="text-gray-300 text-lg">★</span>
//                 ))}
//               </div>

//               {/* Review */}
//               <p className="text-gray-700 text-sm leading-relaxed">
//                 “{review.review}”
//               </p>
//             </div>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// };

// export default ReviewCarousel;


import React, { useRef } from "react";

// Reviews
const reviews = [
  { name: "Sarah Mitchell", role: "HR Manager, TechNova", avatar: "https://i.pravatar.cc/100?img=47", stars: 5,
    review: "This AI interview system transformed our hiring workflow. We reduced screening time by 60%." },
  { name: "Amit Verma", role: "Talent Lead, CloudWave", avatar: "https://i.pravatar.cc/100?img=32", stars: 5,
    review: "The analytics and scoring system are game-changing. Incredible insights." },
  { name: "Julia Gomez", role: "Recruiter, BrightHire", avatar: "https://i.pravatar.cc/100?img=15", stars: 4,
    review: "Super intuitive and the automated interviews save hours weekly." },
  { name: "Marcus Levy", role: "Hiring Director, SkillForge", avatar: "https://i.pravatar.cc/100?img=68", stars: 5,
    review: "Real-time feedback helped us make better hiring decisions." },
  { name: "Linda Sharma", role: "Recruiter, TalentHub", avatar: "https://i.pravatar.cc/100?img=23", stars: 4,
    review: "We saved countless hours. The insights are extremely accurate!" },
  { name: "David Ross", role: "CEO, BuildScale", avatar: "https://i.pravatar.cc/100?img=12", stars: 5,
    review: "Best AI hiring system we've used. Completely worth it." },
];

const ReviewCarousel = () => {
  const scrollRef = useRef(null);

  // DRAG TO SCROLL (works perfectly)
  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;

  const startDragging = (e) => {
    isDown = true;
    scrollRef.current.classList.add("grabbing");
    startX = e.pageX || e.touches?.[0].pageX;
    scrollLeft = scrollRef.current.scrollLeft;
  };

  const stopDragging = () => {
    isDown = false;
    scrollRef.current.classList.remove("grabbing");
  };

  const onDrag = (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX || e.touches?.[0].pageX;
    const walk = (x - startX) * 1.4;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <section className="py-16 md:py-24 bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">

        {/* Title */}
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
          What Our Customers Say
        </h2>

        {/* TRUE AUTO-SCROLL CAROUSEL */}
        <div
          ref={scrollRef}
          className="relative overflow-x-scroll scrollbar-hide cursor-grab select-none"
          onMouseDown={startDragging}
          onMouseLeave={stopDragging}
          onMouseUp={stopDragging}
          onMouseMove={onDrag}
          onTouchStart={startDragging}
          onTouchEnd={stopDragging}
          onTouchMove={onDrag}
        >
          <div className="flex gap-6 animate-slide-left w-max">
            {[...reviews, ...reviews].map((review, index) => (
              <div
                key={index}
                className="
                  min-w-[300px] md:min-w-[350px]
                  bg-white rounded-xl shadow-md hover:shadow-xl
                  transition p-6 border border-gray-200
                "
              >
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={review.avatar}
                    alt={review.name}
                    className="w-14 h-14 rounded-full shadow"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">{review.name}</h4>
                    <p className="text-sm text-gray-600">{review.role}</p>
                  </div>
                </div>

                <div className="flex mb-3">
                  {"★".repeat(review.stars).split("").map((_, i) => (
                    <span key={i} className="text-yellow-500 text-lg">★</span>
                  ))}
                  {"★".repeat(5 - review.stars).split("").map((_, i) => (
                    <span key={i} className="text-gray-300 text-lg">★</span>
                  ))}
                </div>

                <p className="text-gray-700 text-sm leading-relaxed">
                  “{review.review}”
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReviewCarousel;

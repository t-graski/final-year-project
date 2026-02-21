using backend.dtos;
using backend.responses;
using backend.services.interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.controllers;

[ApiController]
[Route("api/modules")]
public class ModuleController(IModuleService modules) : ControllerBase
{
    [HttpGet("{id:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<ModuleDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetById(Guid id) => Ok(ApiResponse<ModuleDto>.Ok(await modules.GetByIdAsync(id)));

    [HttpPost("{moduleId:guid}/elements")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<ModuleElementDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateElement(Guid moduleId, CreateModuleElementDto dto)
    {
        var created = await modules.CreateElementAsync(moduleId, dto);
        return StatusCode(201, ApiResponse<ModuleElementDto>.Ok(created, 201));
    }

    [HttpPut("{moduleId:guid}/elements/{elementId:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<ModuleElementDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateElement(Guid moduleId, Guid elementId, UpdateModuleElementDto dto)
        => Ok(ApiResponse<ModuleElementDto>.Ok(await modules.UpdateElementAsync(moduleId, elementId, dto)));

    [HttpDelete("{moduleId:guid}/elements/{elementId:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteElement(Guid moduleId, Guid elementId)
    {
        await modules.DeleteElementAsync(moduleId, elementId);
        return Ok(ApiResponse<object>.Ok(new { }));
    }

    [HttpPut("{moduleId:guid}/elements/reorder")]
    [Authorize]
    public async Task<IActionResult> Reorder(Guid moduleId, ReorderModuleElementsDto dto)
    {
        await modules.ReorderElementsAsync(moduleId, dto);
        return Ok(ApiResponse<object>.Ok(new { }));
    }
}